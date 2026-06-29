import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.models import (
    User, Parent, Student, Admission, Message, Notification, 
    NotificationRecipient, Announcement, Event, AdminLog
)
from app.models.enums import UserRole, AdmissionStatus, SchoolClass, NotificationType
from app.schemas.schemas import (
    AdminStatsResponse, PaginatedAdmissionsResponse, PaginatedMessagesResponse,
    PaginatedAuditLogsResponse, AdminAnalyticsResponse, AdminAnalyticsActivity,
    AdmissionResponse, MessageResponse, NotificationResponse,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse,
    EventCreate, EventUpdate, EventResponse, AdmissionUpdate
)
from app.api.deps import get_current_user, require_role, register_audit_log

router = APIRouter()


class ReadStatusUpdate(BaseModel):
    is_read: bool


# -----------------------------------------------------------------
# 📊 1. STATISTICS & GENERAL ANALYTICS
# -----------------------------------------------------------------
@router.get("/stats", response_model=AdminStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Computes aggregated performance counters of primary database entities.
    Restricted to Super Admin and Staff.
    """
    total_students = db.query(Student).filter(Student.is_deleted == False).count()
    total_parents = db.query(Parent).filter(Parent.is_deleted == False).count()
    total_admissions = db.query(Admission).filter(Admission.is_deleted == False).count()
    pending_admissions = db.query(Admission).filter(Admission.status == AdmissionStatus.PENDING, Admission.is_deleted == False).count()
    approved_admissions = db.query(Admission).filter(Admission.status == AdmissionStatus.APPROVED, Admission.is_deleted == False).count()
    rejected_admissions = db.query(Admission).filter(Admission.status == AdmissionStatus.REJECTED, Admission.is_deleted == False).count()
    total_messages = db.query(Message).filter(Message.is_deleted == False).count()
    unread_messages = db.query(Message).filter(Message.is_read == False, Message.is_deleted == False).count()
    total_notifications = db.query(Notification).filter(Notification.is_deleted == False).count()

    return {
        "total_students": total_students,
        "total_parents": total_parents,
        "total_admissions": total_admissions,
        "pending_admissions": pending_admissions,
        "approved_admissions": approved_admissions,
        "rejected_admissions": rejected_admissions,
        "total_messages": total_messages,
        "unread_messages": unread_messages,
        "total_notifications": total_notifications
    }


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_dashboard_analytics_snapshot(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Fetches real-time consolidated query timelines of recent application interactions.
    Restricted to Super Admin and Staff.
    """
    recent_admissions = db.query(Admission).filter(Admission.is_deleted == False).order_by(Admission.created_at.desc()).limit(5).all()
    recent_messages = db.query(Message).filter(Message.is_deleted == False).order_by(Message.created_at.desc()).limit(5).all()
    recent_notifications = db.query(Notification).filter(Notification.is_deleted == False).order_by(Notification.created_at.desc()).limit(5).all()
    
    # Audit log extraction
    recent_logs = db.query(AdminLog).outerjoin(User, AdminLog.admin_id == User.id).order_by(AdminLog.created_at.desc()).limit(5).all()
    
    raw_activities = []
    for log in recent_logs:
        admin_name = log.admin.name if log.admin else "System/Guest"
        raw_activities.append(
            AdminAnalyticsActivity(
                id=log.id,
                action=log.action,
                admin_name=admin_name,
                created_at=log.created_at
            )
        )

    return {
        "recent_admissions": recent_admissions,
        "recent_messages": recent_messages,
        "recent_notifications": recent_notifications,
        "recent_activity": raw_activities
    }


# -----------------------------------------------------------------
# 📝 2. ADMISSIONS MANAGEMENT
# -----------------------------------------------------------------
@router.get("/admissions", response_model=PaginatedAdmissionsResponse)
def list_admissions_portal_admin(
    page: int = 1,
    limit: int = 20,
    status: Optional[AdmissionStatus] = None,
    class_applied: Optional[SchoolClass] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Query, search, sort, and slice paginated admission records.
    Restricted to Super Admin and Staff.
    """
    query = db.query(Admission).filter(Admission.is_deleted == False)

    if status:
        query = query.filter(Admission.status == status)
    if class_applied:
        query = query.filter(Admission.class_applied == class_applied)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Admission.student_name.ilike(pattern)) |
            (Admission.parent_name.ilike(pattern)) |
            (Admission.email.ilike(pattern))
        )

    # Resolve soft sort order safely
    sort_attribute = getattr(Admission, sort_by, Admission.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_attribute.desc())
    else:
        query = query.order_by(sort_attribute.asc())

    total_count = query.count()
    pages = (total_count + limit - 1) // limit if limit > 0 else 1
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "pages": pages,
        "limit": limit
    }


@router.get("/admissions/{id}", response_model=AdmissionResponse)
def get_admission_by_id_admin(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Retrieve descriptive details of a specific candidate application.
    """
    admission = db.query(Admission).filter(Admission.id == id, Admission.is_deleted == False).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The defined admission profile does not exist."
        )
    return admission


@router.patch("/admissions/{id}/status", response_model=AdmissionResponse)
def patch_admission_status_admin(
    id: uuid.UUID,
    status_update: AdmissionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Administrative status updates and workflow approvals.
    Implements cascading audit logs.
    """
    admission = db.query(Admission).filter(Admission.id == id, Admission.is_deleted == False).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission context target missing."
        )

    old_status = admission.status
    if status_update.status:
        admission.status = status_update.status
    if status_update.remarks:
        admission.remarks = status_update.remarks

    db.commit()
    db.refresh(admission)

    # Auditing transition
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db=db,
        action=f"Admission Modified to {admission.status.value}",
        admin_id=current_user.id,
        ip_address=client_host,
        before_data={"status": old_status.value},
        after_data={"status": admission.status.value}
    )

    return admission


# -----------------------------------------------------------------
# ✉️ 3. MESSAGES MANAGEMENT
# -----------------------------------------------------------------
@router.get("/messages", response_model=PaginatedMessagesResponse)
def list_messages_admin(
    page: int = 1,
    limit: int = 20,
    is_read: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Query contact or enrollment inquiries.
    """
    query = db.query(Message).filter(Message.is_deleted == False)

    if is_read is not None:
        query = query.filter(Message.is_read == is_read)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Message.name.ilike(pattern)) |
            (Message.email.ilike(pattern)) |
            (Message.subject.ilike(pattern))
        )

    query = query.order_by(Message.created_at.desc())
    total_count = query.count()
    pages = (total_count + limit - 1) // limit if limit > 0 else 1
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "pages": pages,
        "limit": limit
    }


@router.get("/messages/{id}", response_model=MessageResponse)
def get_message_detail_admin(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Fetches message details.
    """
    message = db.query(Message).filter(Message.id == id, Message.is_deleted == False).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact message not found."
        )
    return message


@router.patch("/messages/{id}/read", response_model=MessageResponse)
def toggle_message_read_state(
    id: uuid.UUID,
    update_data: ReadStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Updates the parsed/unread context metadata of feedback forms.
    """
    message = db.query(Message).filter(Message.id == id, Message.is_deleted == False).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact message not found."
        )

    message.is_read = update_data.is_read
    db.commit()
    db.refresh(message)
    return message


@router.delete("/messages/{id}", status_code=status.HTTP_200_OK)
def delete_contact_message(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Performs critical safe soft-erasure of messages from dashboards.
    """
    message = db.query(Message).filter(Message.id == id, Message.is_deleted == False).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact message context not active."
        )

    message.is_deleted = True
    message.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Feedback form submission deleted successfully."}


# -----------------------------------------------------------------
# 🔔 4. NOTIFICATION MANAGEMENT
# -----------------------------------------------------------------
@router.get("/notifications", response_model=List[NotificationResponse])
def list_system_notifications_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Lists system-wide notification feeds.
    """
    notifications = db.query(Notification).filter(Notification.is_deleted == False).order_by(Notification.created_at.desc()).all()
    return notifications


@router.patch("/notifications/{id}/read", status_code=status.HTTP_200_OK)
def mark_admin_specific_notification_as_read(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Safely marks system alerts as logged/read for the administrative account.
    """
    recipient_entry = db.query(NotificationRecipient).filter(
        NotificationRecipient.notification_id == id,
        NotificationRecipient.recipient_id == current_user.id
    ).first()

    if not recipient_entry:
        # Generate on demand to trace state for the logged admin
        recipient_entry = NotificationRecipient(
            notification_id=id,
            recipient_id=current_user.id,
            is_read=True,
            read_at=datetime.now(timezone.utc)
        )
        db.add(recipient_entry)
    else:
        recipient_entry.is_read = True
        recipient_entry.read_at = datetime.now(timezone.utc)

    db.commit()
    return {"message": "Notification read status marked."}


@router.delete("/notifications/{id}", status_code=status.HTTP_200_OK)
def delete_system_alert(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Soft-deletes notifications.
    """
    notification = db.query(Notification).filter(Notification.id == id, Notification.is_deleted == False).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target system notification not found."
        )

    notification.is_deleted = True
    notification.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "System alert soft-deleted successfully."}


# -----------------------------------------------------------------
# 📢 5. ANNOUNCEMENTS CRUD
# -----------------------------------------------------------------
@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement_admin(
    announcement_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Dispatches news, banners, and circulars to the portal.
    """
    db_announcement = Announcement(
        title=announcement_in.title,
        description=announcement_in.description,
        category=announcement_in.category,
        visibility=announcement_in.visibility
    )
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement


@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements_list_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Lists circular records.
    """
    return db.query(Announcement).filter(Announcement.is_deleted == False).order_by(Announcement.created_at.desc()).all()


@router.get("/announcements/{id}", response_model=AnnouncementResponse)
def get_announcement_detail_admin(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Details of a single circular.
    """
    announcement = db.query(Announcement).filter(Announcement.id == id, Announcement.is_deleted == False).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found.")
    return announcement


@router.patch("/announcements/{id}", response_model=AnnouncementResponse)
def update_announcement_admin(
    id: uuid.UUID,
    update_data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Updates circulars content or target user visibility.
    """
    announcement = db.query(Announcement).filter(Announcement.id == id, Announcement.is_deleted == False).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found.")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(announcement, field, value)

    db.commit()
    db.refresh(announcement)
    return announcement


@router.delete("/announcements/{id}", status_code=status.HTTP_200_OK)
def delete_announcement_admin(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Removes circular.
    """
    announcement = db.query(Announcement).filter(Announcement.id == id, Announcement.is_deleted == False).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found.")

    announcement.is_deleted = True
    announcement.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Announcement retired and soft-deleted."}


# -----------------------------------------------------------------
# 📅 6. EVENTS CRUD
# -----------------------------------------------------------------
@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event_admin(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Schedules athletic, cultural, or academic events.
    """
    db_event = Event(
        title=event_in.title,
        description=event_in.description,
        date=event_in.date,
        location=event_in.location,
        status=event_in.status
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/events", response_model=List[EventResponse])
def get_events_list_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Lists scheduled dates.
    """
    return db.query(Event).filter(Event.is_deleted == False).order_by(Event.date.asc()).all()


@router.get("/events/{id}", response_model=EventResponse)
def get_event_detail_admin(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Detail on school calendars.
    """
    event = db.query(Event).filter(Event.id == id, Event.is_deleted == False).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School event context missing.")
    return event


@router.patch("/events/{id}", response_model=EventResponse)
def update_event_admin(
    id: uuid.UUID,
    update_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Updates schedules, locators, and calendar descriptions.
    """
    event = db.query(Event).filter(Event.id == id, Event.is_deleted == False).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School event context missing.")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{id}", status_code=status.HTTP_200_OK)
def delete_event_admin(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Retires event scheduling context.
    """
    event = db.query(Event).filter(Event.id == id, Event.is_deleted == False).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School event context missing.")

    event.is_deleted = True
    event.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Calendar event soft-deleted."}


# -----------------------------------------------------------------
# 🔍 7. PRIVILEGED AUDIT TRAILS
# -----------------------------------------------------------------
@router.get("/audit-logs", response_model=PaginatedAuditLogsResponse)
def list_system_audit_logs(
    page: int = 1,
    limit: int = 20,
    action: Optional[str] = None,
    admin_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Fetches immutable cybersecurity action logs and operations audits.
    Restricted to Super Admin and Staff.
    """
    query = db.query(AdminLog)

    if action:
        query = query.filter(AdminLog.action == action)
    if admin_id:
        query = query.filter(AdminLog.admin_id == admin_id)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (AdminLog.action.ilike(pattern)) |
            (AdminLog.ip_address.ilike(pattern))
        )

    # Ordered descending (most recent interactions first)
    query = query.order_by(AdminLog.created_at.desc())

    total_count = query.count()
    pages = (total_count + limit - 1) // limit if limit > 0 else 1
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "pages": pages,
        "limit": limit
    }
