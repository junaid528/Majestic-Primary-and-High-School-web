import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Message, User
from app.models.enums import NotificationType, UserRole
from app.schemas.schemas import MessageCreate, MessageResponse
from app.api.deps import get_current_user, register_audit_log, require_role
from app.services.notification import notify_admins

router = APIRouter()

@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_inquiry(
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Public access endpoint to submit general contact, support, or inquiry messages.
    Stores inquiries and dispatches notification triggers onto administration queues.
    """
    # 1. Store candidate contact details
    db_message = Message(
        name=message_in.name,
        email=message_in.email,
        phone=message_in.phone,
        subject=message_in.subject,
        message=message_in.message,
        is_read=False
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # 2. Automatically dispatch status notification updating admins
    notify_admins(
        db=db,
        notification_type=NotificationType.NEW_MESSAGE,
        message=f"New portal inquiry submitted by '{db_message.name}' regarding '{db_message.subject or 'General Inquiry'}'."
    )

    # 3. Write informational audit trail logs
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db=db,
        action="Inquiry Submitted",
        ip_address=client_host,
        after_data={
            "message_id": str(db_message.id),
            "email": db_message.email,
            "subject": db_message.subject
        }
    )

    return db_message


@router.get("/{id}", response_model=MessageResponse)
def get_contact_inquiry(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Restricted administration endpoint to fetch deep details of a custom support or enrollment contact message.
    """
    message = db.query(Message).filter(
        Message.id == id,
        Message.is_deleted == False
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested contact inquiry message was not found."
        )

    return message
