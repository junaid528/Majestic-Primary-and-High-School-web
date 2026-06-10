import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Admission, Upload, User
from app.models.enums import AdmissionStatus, SchoolClass, NotificationType, UserRole
from app.schemas.schemas import AdmissionCreate, AdmissionUpdate, AdmissionResponse
from app.api.deps import get_current_user, register_audit_log, require_role
from app.services.notification import notify_admins, create_system_notification

router = APIRouter()

@router.post("", response_model=AdmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_admission(
    admission_in: AdmissionCreate,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Submits a new school admission application.
    Validates duplicate submissions and triggers high-importance administrative notifications.
    """
    # 1. Check for possible duplicate pending/approved submissions to prevent spam or double submits
    duplicate = db.query(Admission).filter(
        Admission.student_name == admission_in.student_name,
        Admission.email == admission_in.email,
        Admission.class_applied == admission_in.class_applied,
        Admission.status.in_([AdmissionStatus.PENDING, AdmissionStatus.APPROVED]),
        Admission.is_deleted == False
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active or pending application already exists for this candidate in the requested class."
        )

    # 2. Instantiate persistent DB row
    db_admission = Admission(
        student_name=admission_in.student_name,
        parent_name=admission_in.parent_name,
        mobile=admission_in.mobile,
        email=admission_in.email,
        class_applied=admission_in.class_applied,
        address=admission_in.address,
        previous_school=admission_in.previous_school,
        remarks=admission_in.remarks,
        status=AdmissionStatus.PENDING
    )
    db.add(db_admission)
    db.commit()
    db.refresh(db_admission)

    # 3. Trigger targeted admin notifications
    notify_admins(
        db=db,
        notification_type=NotificationType.NEW_ADMISSION,
        message=f"New admission application submitted by Parent '{db_admission.parent_name}' for Candidate '{db_admission.student_name}' ({db_admission.class_applied.value})."
    )

    # 4. Write audit trail action register
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db=db,
        action="Admission Submitted",
        ip_address=client_host,
        after_data={
            "admission_id": str(db_admission.id),
            "student_name": db_admission.student_name,
            "class_applied": db_admission.class_applied.value
        }
    )

    return db_admission


@router.get("/{id}", response_model=AdmissionResponse)
def get_admission_by_id(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves full details of a specific admission application.
    Enforces authorization: Super Admin, Staff, or parent matching the application email can access.
    """
    admission = db.query(Admission).filter(
        Admission.id == id,
        Admission.is_deleted == False
    ).first()

    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested admission application does not exist or was deleted."
        )

    # Access constraints: Admins can see anything, users can see only matching emails
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.STAFF]:
        if current_user.email != admission.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have administrative rights to view this applicant details."
            )

    return admission


@router.patch("/{id}/status", response_model=AdmissionResponse)
def patch_admission_status(
    id: uuid.UUID,
    status_update: AdmissionUpdate,  # Reuse or specific partial schema
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.STAFF))
) -> Any:
    """
    Allows Authorized Admin or Staff members to modify admission application states (Approved, Rejected, Pending).
    Trigger targeted applicant notice updates during state transitions.
    """
    admission = db.query(Admission).filter(
        Admission.id == id,
        Admission.is_deleted == False
    ).first()

    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target admission application not found."
        )

    if not status_update.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing status transition parameter fields."
        )

    old_status = admission.status
    new_status = status_update.status

    if old_status == new_status:
        return admission

    # Apply changes
    admission.status = new_status
    
    # Store dynamic metadata update context if present
    if status_update.remarks:
        admission.remarks = status_update.remarks

    db.commit()
    db.refresh(admission)

    # 1. Trigger notification updates depending on the status outcomes to candidate parent profiles
    matching_parent = db.query(User).filter(User.email == admission.email, User.is_deleted == False).first()
    recipient_ids = [matching_parent.id] if matching_parent else None

    state_desc = "Approved" if new_status == AdmissionStatus.APPROVED else "Rejected"
    notification_msg = f"Your admission application for candidate '{admission.student_name}' has been {state_desc}."

    if recipient_ids:
        create_system_notification(
            db=db,
            notification_type=NotificationType.ADMISSION_UPDATED,
            message=notification_msg,
            recipient_ids=recipient_ids,
            is_broadcast=False
        )
    else:
        # If no local account matching email, log general broadcast alert
        notify_admins(
            db=db,
            notification_type=NotificationType.ADMISSION_UPDATED,
            message=f"Admission application '{admission.id}' state changed from {old_status.value} to {new_status.value}."
        )

    # 2. Write Audit trail logs
    client_host = request.client.host if request.client else "Unknown"
    register_audit_log(
        db=db,
        action=f"Admission Status Updated to {new_status.value}",
        admin_id=current_user.id,
        ip_address=client_host,
        before_data={"id": str(admission.id), "status": old_status.value},
        after_data={"id": str(admission.id), "status": new_status.value}
    )

    return admission
