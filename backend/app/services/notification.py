import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.models import Notification, NotificationRecipient, User
from app.models.enums import NotificationType, UserRole

def create_system_notification(
    db: Session,
    notification_type: NotificationType,
    message: str,
    recipient_ids: Optional[List[uuid.UUID]] = None,
    is_broadcast: bool = False
) -> Notification:
    """
    Creates a system notification and maps it to either a specific list of target users
    or designates it as a broadcast across the system.
    """
    # 1. Create the main Notification record
    notification = Notification(
        type=notification_type,
        message=message,
        is_broadcast=is_broadcast
    )
    db.add(notification)
    db.flush() # Secure the generated ID

    # 2. Add recipients
    if is_broadcast:
        # For broadcast, we register recipient records for all active users so they can track individual read states
        active_users = db.query(User).filter(User.is_deleted == False, User.status == "Active").all()
        for user in active_users:
            recipient = NotificationRecipient(
                notification_id=notification.id,
                recipient_id=user.id,
                is_read=False
            )
            db.add(recipient)
    elif recipient_ids:
        # Create recipient associations for defined users only
        distinct_ids = set(recipient_ids)
        for r_id in distinct_ids:
            # Confirm user existence
            user_exists = db.query(User).filter(User.id == r_id, User.is_deleted == False).first()
            if user_exists:
                recipient = NotificationRecipient(
                    notification_id=notification.id,
                    recipient_id=r_id,
                    is_read=False
                )
                db.add(recipient)
    
    db.commit()
    db.refresh(notification)
    return notification


def notify_admins(
    db: Session,
    notification_type: NotificationType,
    message: str
) -> Notification:
    """
    Convenience method to target administrative users (Super Admins and Staff) for specific alerts
    like new admission applications or system errors.
    """
    admins = db.query(User).filter(
        User.role.in_([UserRole.SUPER_ADMIN, UserRole.STAFF]),
        User.is_deleted == False,
        User.status == "Active"
    ).all()
    
    admin_ids = [admin.id for admin in admins]
    return create_system_notification(
        db=db,
        notification_type=notification_type,
        message=message,
        recipient_ids=admin_ids,
        is_broadcast=False
    )
