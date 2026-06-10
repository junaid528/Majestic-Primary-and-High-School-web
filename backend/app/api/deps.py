import uuid
from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.core.config import settings
from app.db.session import get_db
from app.models.models import User, AdminLog
from app.models.enums import UserRole

# Configures OAuth2 token scheme extraction
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    Dependency to resolve, decrypt, and validate current user requests.
    """
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate signature credentials. Token might be expired or altered.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session payload format is invalid.",
        )
    
    # Try resolving user corresponding to token subject
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity format is corrupted.",
        )
        
    user = db.query(User).filter(User.id == user_uuid, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user record was suspended or deleted.",
        )
        
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User registration status is suspended or inactive.",
        )

    # Evict sessions on user version mismatch (revocation system verification)
    token_version_in_claim = payload.get("token_version")
    if token_version_in_claim is not None and token_version_in_claim != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has been revoked. Reasons include password changes, security locks, or administrative modifications. Please login again.",
        )
        
    return user


class RoleChecker:
    """
    RBAC middle logic wrapper acting as a generic route permission guard.
    """
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficent role credentials. Requires permission: {[r.value for r in self.allowed_roles]}.",
            )
        return current_user


def require_role(*roles: UserRole) -> RoleChecker:
    """
    Elegant helper to declare endpoint-level RBAC constraints.
    """
    return RoleChecker(list(roles))


def register_audit_log(
    db: Session,
    action: str,
    admin_id: Optional[uuid.UUID] = None,
    ip_address: Optional[str] = None,
    before_data: Optional[dict] = None,
    after_data: Optional[dict] = None,
) -> AdminLog:
    """
    Asynchronous and synchronous safe utility to insert standardized event logs.
    """
    log_entry = AdminLog(
        admin_id=admin_id,
        action=action,
        ip_address=ip_address,
        before_data=before_data,
        after_data=after_data,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
