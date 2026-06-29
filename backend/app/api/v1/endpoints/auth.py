import uuid
import hashlib
import hmac
import base64
import struct
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.models import User, UserInvitation, Student, Parent, AdminLog
from app.models.enums import UserRole, StudentStatus, SchoolClass, NotificationType
from app.schemas.schemas import (
    LoginRequest, Token, UserResponse, PasswordResetRequest,
    PasswordResetConfirm, InvitationAccept, AcademicYearResponse,
    MFASetupResponse, MFAVerifyRequest, loginMFAVerifyRequest
)
from app.api.deps import get_current_user, register_audit_log, require_role
from app.services.notification import notify_admins
from fastapi import Body

router = APIRouter()

# Simple IP-based in-memory rate-limiter
LOGIN_RATE_LIMITS: Dict[str, List[datetime]] = {}
MAX_LOGIN_ATTEMPTS_PER_MINUTE = 10

def check_ip_rate_limit(ip_address: str):
    """
    Stateless track of connection logs to prevent authentication floods.
    Allows maximum of 10 login operations per discrete IP every rolling minute.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=1)
    
    # Retrieve & filter old logs
    timestamps = LOGIN_RATE_LIMITS.get(ip_address, [])
    timestamps = [ts for ts in timestamps if ts > cutoff]
    
    if len(timestamps) >= MAX_LOGIN_ATTEMPTS_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication operations requested from this connection. Please try again in 1 minute.",
        )
    
    timestamps.append(now)
    LOGIN_RATE_LIMITS[ip_address] = timestamps


def hash_token(token: str) -> str:
    """
    Compute secure cryptographic verification hash for password reset tokens.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/login", response_model=Token)
def login_portal(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Standard portal authentication endpoint with lockout protection and IP rate limit validation.
    Accepts credentials, returns signed bearer tokens and updates last_login timestamp.
    """
    client_host = request.client.host if request.client else "Unknown"
    check_ip_rate_limit(client_host)
    
    user = db.query(User).filter(User.email == login_data.email, User.is_deleted == False).first()
    if not user:
        # Generic message to defend against email enumeration harvests
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password combination.",
        )
    
    # Check if user is locked out due to repeated failed login attempts
    if user.lockout_until:
        lockout_time = user.lockout_until.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < lockout_time:
            remaining_seconds = int((lockout_time - datetime.now(timezone.utc)).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This account is temporarily locked due to repeated logging failures. Please try again in {remaining_seconds} seconds.",
            )
        else:
            # Lockout expired, reset counters
            user.lockout_until = None
            user.failed_login_attempts = 0
            db.commit()

    if not verify_password(login_data.password, user.password_hash):
        user.failed_login_attempts += 1
        audit_payload = {"failed_attempts": user.failed_login_attempts}
        
        # Lockout condition: >= 5 failures
        if user.failed_login_attempts >= 5:
            user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            audit_payload["locked_until"] = user.lockout_until.isoformat()
            
            register_audit_log(
                db,
                action="Account Temporarily Locked",
                admin_id=user.id,
                ip_address=client_host,
                after_data=audit_payload
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many incorrect password attempts. This account is locked for 15 minutes.",
            )
            
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password combination.",
        )
        
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is currently marked inactive or suspended.",
        )
        
    # Reset successful attempts tracker
    user.failed_login_attempts = 0
    user.lockout_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    # Audit trail log
    register_audit_log(
        db,
        action="Login",
        admin_id=user.id,
        ip_address=client_host,
        before_data={"email": user.email, "role": user.role.value},
        after_data={"last_login": user.last_login.isoformat()}
    )
    
    # Generate token
    if user.is_mfa_enabled:
        return {"access_token": "MFA_PENDING_REQUIRES_TOTP_VERIFICATION", "token_type": "mfa_pending"}
        
    token_str = create_access_token(subject=user.id, email=user.email, role=user.role.value, token_version=user.token_version)
    return {"access_token": token_str, "token_type": "bearer"}


@router.post("/signup")
def signup_portal(
    payload: dict = Body(...),
    request: Request = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Public registration endpoint used by the legacy frontend pages.
    Creates a basic `User` record (Student role) and sends admin notification.
    """
    name = payload.get('name') or payload.get('fullName')
    email = payload.get('email')
    password = payload.get('password')
    phone = payload.get('phone') or payload.get('mobile') or payload.get('mobileNumber') or payload.get('mobile_number')

    if not name or not email or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name, email and password are required.")

    existing = db.query(User).filter(User.email == email, User.is_deleted == False).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    hashed = get_password_hash(password)
    new_user = User(
        name=name,
        email=email,
        mobile_number=phone,
        password_hash=hashed,
        role=UserRole.STUDENT,
        status="Active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Notify admins
    try:
        notify_admins(db=db, notification_type=NotificationType.USER_REGISTERED, message=f"New registration: {new_user.name} ({new_user.email})")
    except Exception:
        pass

    # Audit log
    client_host = request.client.host if request and request.client else "Unknown"
    register_audit_log(db=db, action="User Registered", ip_address=client_host, after_data={"email": new_user.email})

    return {"message": "Registration successful!"}


@router.post("/admin-login", response_model=Token)
def login_admin(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restricted admin control panel route incorporating IP rate-limits and temporary lockouts.
    Restricts access to Super Admin or Staff roles exclusively.
    """
    client_host = request.client.host if request.client else "Unknown"
    check_ip_rate_limit(client_host)
    
    user = db.query(User).filter(User.email == login_data.email, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized admin account.",
        )
        
    if user.role not in [UserRole.SUPER_ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User role has insufficient administrative rights.",
        )
        
    # Check if user is locked out
    if user.lockout_until:
        lockout_time = user.lockout_until.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < lockout_time:
            remaining_seconds = int((lockout_time - datetime.now(timezone.utc)).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This administrative account is temporarily locked. Please try again in {remaining_seconds} seconds.",
            )
        else:
            user.lockout_until = None
            user.failed_login_attempts = 0
            db.commit()

    if not verify_password(login_data.password, user.password_hash):
        user.failed_login_attempts += 1
        audit_payload = {"failed_attempts": user.failed_login_attempts, "admin_context": True}
        
        if user.failed_login_attempts >= 5:
            user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            audit_payload["locked_until"] = user.lockout_until.isoformat()
            
            register_audit_log(
                db,
                action="Admin Account Temporarily Locked",
                admin_id=user.id,
                ip_address=client_host,
                after_data=audit_payload
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many incorrect password attempts. This admin account is locked for 15 minutes.",
            )
            
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )
        
    # Reset lock counters
    user.failed_login_attempts = 0
    user.lockout_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    register_audit_log(
        db,
        action="Admin Login",
        admin_id=user.id,
        ip_address=client_host,
        before_data={"email": user.email},
        after_data={"admin_access_granted": True}
    )
    
    if user.is_mfa_enabled:
        return {"access_token": "MFA_PENDING_REQUIRES_TOTP_VERIFICATION", "token_type": "mfa_pending"}
        
    token_str = create_access_token(subject=user.id, email=user.email, role=user.role.value, token_version=user.token_version)
    return {"access_token": token_str, "token_type": "bearer"}


@router.post("/logout")
@router.get("/logout")
def logout_portal(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Standard portal explicit session destruction endpoint.
    Audits the logout transaction event for full auditability.
    """
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db,
        action="Logout",
        admin_id=current_user.id,
        ip_address=client_host,
        before_data={"email": current_user.email},
        after_data={"logout_timestamp": datetime.now(timezone.utc).isoformat()}
    )
    return {"message": "You have been logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Extracts profile metadata for the currently active session user.
    """
    return current_user


@router.post("/forgot-password")
def forgot_password_request(
    reset_req: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Generates high-security verification tokens with a tight 15-minute validity window.
    Stores the securely computed SHA-256 token hash on reset_token_hash.
    """
    client_host = request.client.host if request.client else "Unknown"
    check_ip_rate_limit(client_host)

    user = db.query(User).filter(User.email == reset_req.email, User.is_deleted == False).first()
    if not user:
        # Prevent enum/brute-force email harvesting - return successful response message safely
        return {"message": "If an active registration matches this email, a reset token has been produced."}
        
    # Create secure random string token
    reset_token = uuid.uuid4().hex + uuid.uuid4().hex
    expiry_time = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    user.reset_token_hash = hash_token(reset_token)
    user.reset_expiry = expiry_time
    db.commit()
    
    # Audit trail reset validation
    register_audit_log(
        db,
        action="Password Reset Requested",
        admin_id=user.id,
        ip_address=client_host,
        after_data={"expiry": expiry_time.isoformat()}
    )
    
    # Return reset parameters to validate mock workflow.
    return {
        "message": "Reset verification window generated successfully.",
        "token": reset_token,
        "expires_at": expiry_time.isoformat()
    }


@router.post("/reset-password")
def confirm_password_reset(
    reset_confirm: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Validates reset tokens, replaces old hashes, forces a password update flags check,
    and invalidates used SHA-256 token hashes.
    """
    client_host = request.client.host if request.client else "Unknown"
    check_ip_rate_limit(client_host)

    user = db.query(User).filter(User.email == reset_confirm.email, User.is_deleted == False).first()
    if not user or not user.reset_token_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or inactive token request context.",
        )
        
    hashed_incoming_token = hash_token(reset_confirm.token)
    if user.reset_token_hash != hashed_incoming_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tokens mismatch or signature is wrong.",
        )
        
    if user.reset_expiry and datetime.now(timezone.utc) > user.reset_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification token has expired.",
        )
        
    # Overwrite hashed credentials and revoke active JWT sessions
    user.password_hash = get_password_hash(reset_confirm.password)
    user.is_password_reset_required = False
    user.token_version += 1
    
    # Invalidate token hash
    user.reset_token_hash = None
    user.reset_expiry = None
    db.commit()
    
    register_audit_log(
        db,
        action="Password Overwrite (Reset)",
        admin_id=user.id,
        ip_address=client_host,
        after_data={"success": True}
    )
    
    return {"message": "Your password is reset successfully, login to proceed."}


@router.post("/accept-invitation")
def accept_user_invitation(
    token: str,
    accept_data: InvitationAccept,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Onboarding flow completion.
    Validates Invitation token hashes, creates user records with custom names and passwords,
    attaches appropriate child/student profiles, completes invitation states, and indexes details with Log audits.
    """
    # Simply match hash directly
    invite = db.query(UserInvitation).filter(
        UserInvitation.token_hash == token,
        UserInvitation.is_deleted == False
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active invitation metadata not found. It might be deleted or wrong.",
        )
        
    if invite.used_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation token has already been claimed.",
        )
        
    if datetime.now(timezone.utc) > invite.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This onboarding invitation token has expired.",
        )
        
    # Check if user already exists
    dup = db.query(User).filter(User.email == invite.email, User.is_deleted == False).first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A system user is already active under this email address.",
        )
        
    # 1. Create native User profile
    new_user = User(
        name=accept_data.name,
        email=invite.email,
        mobile_number=accept_data.mobile_number,
        password_hash=get_password_hash(accept_data.password),
        role=invite.role,
        status="Active",
        is_password_reset_required=False
    )
    db.add(new_user)
    db.flush() # Yields user ID for relational hooks
    
    # 2. Instantiate Role details
    if invite.role == UserRole.STUDENT:
        new_student = Student(
            user_id=new_user.id,
            class_name=SchoolClass.CLASS_I, # default to class 1, editable by admin
            status=StudentStatus.ACTIVE
        )
        db.add(new_student)
    elif invite.role == UserRole.PARENT:
        new_parent = Parent(
            user_id=new_user.id
        )
        db.add(new_parent)
        
    # 3. Mark Invite as Claimed
    invite.used_at = datetime.now(timezone.utc)
    invite.used_by_user_id = new_user.id
    db.commit()
    
    # 4. Generate Audit log
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db,
        action="Invitation Claimed",
        admin_id=new_user.id,
        ip_address=client_host,
        after_data={"email": invite.email, "role": invite.role.value}
    )
    
    return {
        "message": f"Onboarding complete! Your {invite.role.value} account has been instantiated.",
        "user_id": str(new_user.id)
    }


# -----------------------------------------------------------------
# 🔐 MULTI-FACTOR AUTHENTICATION (MFA) SERVICES FOR ADMINS/STAFF
# -----------------------------------------------------------------

def generate_base32_secret(length: int = 16) -> str:
    """
    Generates a secure random Base32 string for the TOTP master secret key.
    """
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    return "".join(secrets.choice(chars) for _ in range(length))


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """
    Implements standard RFC 6238 Time-Based One-Time Password verification in pure Python.
    Features cryptographic HMACS-SHA1 dynamic truncation with a temporal drift window.
    """
    try:
        secret = secret.strip().replace(" ", "")
        missing_padding = len(secret) % 8
        if missing_padding:
            secret += "=" * (8 - missing_padding)
        key = base64.b32decode(secret, casefold=True)
    except Exception:
        return False
    
    now_epoch = int(time.time() // 30)
    
    # Check within safety window to handle minor click delays
    for w in range(-window, window + 1):
        epoch = now_epoch + w
        msg = struct.pack(">Q", epoch)
        hmac_hash = hmac.new(key, msg, hashlib.sha1).digest()
        
        offset = hmac_hash[-1] & 0x0F
        binary_code = (
            ((hmac_hash[offset] & 0x7F) << 24) |
            ((hmac_hash[offset + 1] & 0xFF) << 16) |
            ((hmac_hash[offset + 2] & 0xFF) << 8) |
            (hmac_hash[offset + 3] & 0xFF)
        )
        candidate_code = binary_code % 1000000
        if f"{candidate_code:06d}" == code:
            return True
            
    return False


@router.get("/mfa/setup", response_model=MFASetupResponse)
def get_mfa_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Generates a unique Base32 enrollment secret and TOTP QR resource link.
    """
    if current_user.is_mfa_enabled:
        return {
            "is_mfa_enabled": True,
            "mfa_secret": current_user.mfa_secret or "",
            "qr_code_uri": ""
        }

    # Generate a fresh secret if not already set
    if not current_user.mfa_secret:
        current_user.mfa_secret = generate_base32_secret()
        db.commit()

    # Create the standard provisioning URI (otpauth://) for Google Authenticator/Authy
    label = f"MajesticSchool:{current_user.email}"
    provisioning_uri = f"otpauth://totp/{label}?secret={current_user.mfa_secret}&issuer=MajesticSchool"

    return {
        "is_mfa_enabled": False,
        "mfa_secret": current_user.mfa_secret,
        "qr_code_uri": provisioning_uri
    }


@router.post("/mfa/enable", status_code=status.HTTP_200_OK)
def enable_mfa(
    mfa_req: MFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Verifies the initial user-provided key code to confirm correct app binding, then locks MFA state to True.
    """
    if current_user.is_mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled on this account."
        )

    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Initiate setup via GET /mfa/setup before finalizing activation."
        )

    # Validate first setup ticket code
    if not verify_totp_code(current_user.mfa_secret, mfa_req.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code failed. Please check your authenticator clock sync and try again."
        )

    current_user.is_mfa_enabled = True
    db.commit()

    # Log cybersecurity event
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db,
        action="MFA Enabled",
        admin_id=current_user.id,
        ip_address=client_host,
        after_data={"mfa_status": "Enabled"}
    )

    return {"message": "Multi-Factor Authentication has been successfully integrated and bound."}


@router.post("/mfa/verify-login", response_model=Token)
def verify_mfa_login(
    verify_req: loginMFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Performs critical Multi-Factor verification login check.
    Saves state, verifies credentials and authenticates TOTP code before issuing standard bearer JWTs.
    """
    client_host = request.client.host if request.client else "Unknown"
    check_ip_rate_limit(client_host)

    user = db.query(User).filter(User.email == verify_req.email, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials or MFA token code."
        )

    # Basic lock check
    if user.lockout_until and datetime.now(timezone.utc) < user.lockout_until.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked. Please wait before retrying."
        )

    # Verify standard password first
    if not verify_password(verify_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials or mfa token code."
        )

    if not user.is_mfa_enabled or not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multi-Factor verification is not active for this profile credentials."
        )

    # Validate high-security 6-digit code
    if not verify_totp_code(user.mfa_secret, verify_req.code):
        user.failed_login_attempts += 1
        db.commit()
        if user.failed_login_attempts >= 5:
            user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many authentication failures. This account is locked for 15 minutes."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid multi-factor code. Please verify your authenticator app status."
        )

    # Reset failure logs on success
    user.failed_login_attempts = 0
    user.lockout_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Log secure event audit
    register_audit_log(
        db,
        action="Login with MFA Success",
        admin_id=user.id,
        ip_address=client_host,
        after_data={"mfa_verified": True}
    )

    token_str = create_access_token(subject=user.id, email=user.email, role=user.role.value, token_version=user.token_version)
    return {"access_token": token_str, "token_type": "bearer"}

