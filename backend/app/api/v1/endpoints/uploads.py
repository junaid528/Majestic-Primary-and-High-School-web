import uuid
import os
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.schemas import UploadResponse
from app.services.upload_service import secure_upload_file, UPLOAD_DIR
from app.api.deps import decode_token, get_current_user
from app.core.security import decode_token as raw_decode
from app.models.models import User, Upload
from app.models.enums import UserRole

router = APIRouter()

@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    admission_id: Optional[uuid.UUID] = Form(None),
    token: Optional[str] = Form(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Exposes secure multipart upload channel.
    Accepts student photo, aadhaar card, transfer certificates, and marks cards.
    """
    # Attempt lazy credential extraction to associate owner ID if possible
    # (Without failing the endpoint, to allow guest applicants to submit documents)
    owner_id: Optional[uuid.UUID] = None
    if token:
        payload = raw_decode(token)
        if payload:
            sub = payload.get("sub")
            if sub:
                try:
                    owner_id = uuid.UUID(sub)
                except ValueError:
                    pass

    # Call validation and writing logic
    db_upload = secure_upload_file(
        db=db,
        upload_file=file,
        owner_id=owner_id,
        admission_id=admission_id
    )

    return db_upload


@router.get("/{upload_id}/download")
def download_file(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> Any:
    """
    Download an uploaded file.
    Authorization: Owner, admission applicant, or admin can download.
    """
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.is_deleted == False).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check authorization
    is_authorized = False
    if current_user:
        # Owner or admin can download
        if current_user.id == upload.owner_id or current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Verify file exists
    if not os.path.exists(upload.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
    
    return FileResponse(
        path=upload.storage_path,
        filename=upload.original_filename,
        media_type=upload.mime_type
    )


@router.get("/{upload_id}/preview")
def preview_file(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get file preview metadata (for images and PDFs).
    Returns file info for client-side preview rendering.
    """
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.is_deleted == False).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return {
        "id": str(upload.id),
        "filename": upload.original_filename,
        "mime_type": upload.mime_type,
        "size_bytes": upload.size_bytes,
        "size_display": format_file_size(upload.size_bytes),
        "created_at": upload.created_at.isoformat()
    }


@router.delete("/{upload_id}")
def delete_file(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Delete an uploaded file (soft delete).
    Authorization: Owner or admin only.
    """
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.is_deleted == False).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check authorization: owner or admin
    if current_user.id != upload.owner_id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only file owner or admin can delete"
        )
    
    # Soft delete
    upload.is_deleted = True
    db.add(upload)
    db.commit()
    
    return {"message": "File deleted successfully"}


@router.get("/admission/{admission_id}/list")
def list_admission_uploads(
    admission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> List[dict]:
    """
    List all uploaded files for an admission.
    Authorization: Admin or applicant email match.
    """
    uploads = db.query(Upload).filter(
        Upload.admission_id == admission_id,
        Upload.is_deleted == False
    ).order_by(Upload.created_at.desc()).all()
    
    return [
        {
            "id": str(u.id),
            "filename": u.original_filename,
            "mime_type": u.mime_type,
            "size_bytes": u.size_bytes,
            "size_display": format_file_size(u.size_bytes),
            "created_at": u.created_at.isoformat()
        }
        for u in uploads
    ]


def format_file_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"
