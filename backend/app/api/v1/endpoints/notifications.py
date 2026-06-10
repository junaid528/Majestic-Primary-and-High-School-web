import uuid
from datetime import datetime, timezone
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import User, Notification, NotificationRecipient
from app.schemas.schemas import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Lists the unread and read notifications mapped specifically to the currently logged-in user.
    """
    # Fetch notifications joined with recipients tracking statuses
    notifications = db.query(Notification).join(
        NotificationRecipient
    ).filter(
        NotificationRecipient.recipient_id == current_user.id,
        Notification.is_deleted == False
    ).order_by(
        Notification.created_at.desc()
    ).all()

    return notifications


@router.patch("/{id}/read", status_code=status.HTTP_200_OK)
def mark_notification_as_read(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Explicitly updates the database notification recipient read state configuration
    for the matching notification.
    """
    recipient_entry = db.query(NotificationRecipient).filter(
        NotificationRecipient.notification_id == id,
        NotificationRecipient.recipient_id == current_user.id
    ).first()

    if not recipient_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The target notification association is missing or does not apply to this user."
        )

    if not recipient_entry.is_read:
        recipient_entry.is_read = True
        recipient_entry.read_at = datetime.now(timezone.utc)
        db.commit()

    return {"message": "Notification read status marked successfully."}
