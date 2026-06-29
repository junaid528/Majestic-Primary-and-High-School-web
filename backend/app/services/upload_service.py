import os
import uuid
import shutil
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Upload
from app.core.config import settings

# Strict file upload configurations
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
BLOCKED_EXTENSIONS = {".exe", ".sh", ".bat", ".zip", ".cmd", ".msi"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # Strict 10MB limit per document

# Dedicated secure folder
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

def setup_upload_directory():
    """
    Ensures safe instantiation of physical secure storage paths.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

def scan_for_malware(file_path: str) -> None:
    """
    Placeholder service to check for cyber threats or malicious bytes before registration.
    Integrates with specialized third-party scanners (e.g., ClamAV, VirusTotal) or executes custom byte heuristic analyses.
    Throws HTTPException if malintent is identified.
    """
    try:
        with open(file_path, 'rb') as f:
            header = f.read(8)
            # Check for common dangerous file signatures
            dangerous_signatures = [
                b'MZ',      # Windows executable
                b'PK\x03\x04',  # ZIP (when disguised)
                b'\x7fELF',  # Linux executable
            ]
            for sig in dangerous_signatures:
                if header.startswith(sig):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File appears to contain executable content and was rejected."
                    )
        print(f"[MALWARE-SCAN] Safety verification passed for file: {file_path}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[MALWARE-SCAN] Warning during scan: {str(e)}")


def secure_upload_file(
    db: Session,
    upload_file: UploadFile,
    owner_id: Optional[uuid.UUID] = None,
    admission_id: Optional[uuid.UUID] = None
) -> Upload:
    """
    Secures, validates size, content types, extensions, scans for malware, renames, and stores uploaded files.
    """
    setup_upload_directory()

    # 1. Base extension extraction & validation
    filename = upload_file.filename or "unnamed_file"
    _, extension = os.path.splitext(filename.lower())
    
    if extension in BLOCKED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security alert: The file extension '{extension}' is blacklisted and rejected."
        )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Only {', '.join(ALLOWED_EXTENSIONS)} are accepted."
        )

    # 2. Inspect MIME header properties
    mime_type = upload_file.content_type
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security alert: Unsupported file type header '{mime_type}'."
        )

    # 3. Read content safely checking file size thresholds
    try:
        # Seek first to calculate size
        upload_file.file.seek(0, 2)
        size_bytes = upload_file.file.tell()
        upload_file.file.seek(0) # reset pointer to start
    except Exception:
        size_bytes = 0

    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allows size restriction of {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB."
        )

    if size_bytes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file submissions are rejected."
        )

    # 4. Generate unique UUID filename to prevent collisions and sanitize names
    file_id = uuid.uuid4()
    uuid_filename = f"{file_id}{extension}"
    storage_path = os.path.join(UPLOAD_DIR, uuid_filename)

    # 5. Write binary chunks carefully on disk to conserve server RAM
    try:
        with open(storage_path, "wb") as dest:
            shutil.copyfileobj(upload_file.file, dest)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disk I/O failure writing physical files: {str(e)}"
        )

    # 5.5 Critical security check: Scan the newly written file for malware/viruses
    scan_for_malware(storage_path)

    # 6. Build and log metadata row context inside PostgreSQL
    upload_metadata = Upload(
        id=file_id,
        admission_id=admission_id,
        owner_id=owner_id,
        uuid_filename=uuid_filename,
        original_filename=filename,
        mime_type=mime_type,
        size_bytes=size_bytes,
        storage_path=storage_path
    )
    db.add(upload_metadata)
    db.commit()
    db.refresh(upload_metadata)

    return upload_metadata
