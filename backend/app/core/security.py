import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Any, Union, Optional
import jwt
from .config import settings

def get_password_hash(password: str) -> str:
    """
    Encrypts password string using secure native salt factors.
    """
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies match of raw candidate password against stored secure hash.
    """
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], email: str, role: str, expires_delta: Optional[timedelta] = None, token_version: int = 1) -> str:
    """
    Signs and issues access tokens incorporating custom claims.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "email": email,
        "role": role,
        "token_version": token_version,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """
    Safely verifies and decodes JWT payloads, identifying tampered signatures.
    """
    try:
        decoded_payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return decoded_payload
    except (jwt.PyJWTError, Exception):
        return None
