import uuid
from datetime import datetime, date, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from ..models.enums import UserRole, AdmissionStatus, StudentStatus, SchoolClass, NotificationType

# ----------------------------------------
# 0. Academic Year Schemas
# ----------------------------------------
class AcademicYearBase(BaseModel):
    year: str = Field(..., examples=["2026-2027"])
    is_current: bool = False

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(BaseModel):
    year: Optional[str] = None
    is_current: Optional[bool] = None

class AcademicYearResponse(AcademicYearBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 1. User Schemas
# ----------------------------------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile_number: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.STUDENT
    status: str = "Active"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=50)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[str] = None
    is_password_reset_required: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_password_reset_required: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 2. Parent Schemas
# ----------------------------------------
class ParentBase(BaseModel):
    profession: Optional[str] = Field(None, max_length=100)
    office_address: Optional[str] = None

class ParentCreate(ParentBase):
    user_id: uuid.UUID

class ParentUpdate(ParentBase):
    pass

class ParentResponse(ParentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 3. Student Schemas
# ----------------------------------------
class StudentBase(BaseModel):
    class_name: SchoolClass
    status: StudentStatus = StudentStatus.ACTIVE

class StudentCreate(StudentBase):
    user_id: uuid.UUID
    admission_id: Optional[uuid.UUID] = None
    academic_year_id: Optional[uuid.UUID] = None

class StudentUpdate(BaseModel):
    class_name: Optional[SchoolClass] = None
    status: Optional[StudentStatus] = None
    academic_year_id: Optional[uuid.UUID] = None

class StudentResponse(StudentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    admission_id: Optional[uuid.UUID] = None
    academic_year_id: Optional[uuid.UUID] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 4. Admission Schemas
# ----------------------------------------
class AdmissionBase(BaseModel):
    student_name: str = Field(..., max_length=100)
    parent_name: str = Field(..., max_length=100)
    mobile: str = Field(..., max_length=20)
    email: EmailStr
    class_applied: SchoolClass
    address: Optional[str] = None
    previous_school: Optional[str] = None
    remarks: Optional[str] = None

class AdmissionCreate(AdmissionBase):
    pass

class AdmissionUpdate(BaseModel):
    student_name: Optional[str] = None
    parent_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    class_applied: Optional[SchoolClass] = None
    address: Optional[str] = None
    previous_school: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[AdmissionStatus] = None

class AdmissionResponse(AdmissionBase):
    id: uuid.UUID
    status: AdmissionStatus
    student_photo: Optional[str] = None
    aadhaar_card: Optional[str] = None
    transfer_certificate: Optional[str] = None
    marks_card: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 5. Message Schemas (Inquiries)
# ----------------------------------------
class MessageBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    subject: Optional[str] = Field("General Inquiry", max_length=150)
    message: str

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    is_read: Optional[bool] = None
    reply_message: Optional[str] = None

class MessageResponse(MessageBase):
    id: uuid.UUID
    is_read: bool
    reply_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 6. Announcement Schemas
# ----------------------------------------
class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    category: str = "General"
    visibility: str = "All"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    visibility: Optional[str] = None

class AnnouncementResponse(AnnouncementBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 7. Event Schemas
# ----------------------------------------
class EventBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    date: date
    location: Optional[str] = Field("School Campus", max_length=150)
    status: str = "Scheduled"

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    location: Optional[str] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 8. Upload Schemas
# ----------------------------------------
class UploadBase(BaseModel):
    original_filename: str
    mime_type: str
    size_bytes: int
    storage_path: str

class UploadCreate(UploadBase):
    uuid_filename: str
    admission_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None

class UploadResponse(UploadBase):
    id: uuid.UUID
    uuid_filename: str
    admission_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 9. Notification Schemas
# ----------------------------------------
class NotificationRecipientResponse(BaseModel):
    recipient_id: uuid.UUID
    is_read: bool
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class NotificationBase(BaseModel):
    type: NotificationType
    message: str
    is_broadcast: bool = True

class NotificationCreate(NotificationBase):
    recipient_ids: Optional[List[uuid.UUID]] = None

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationResponse(NotificationBase):
    id: uuid.UUID
    created_at: datetime
    recipients: List[NotificationRecipientResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 10. Invitation Schemas
# ----------------------------------------
class InvitationBase(BaseModel):
    email: EmailStr
    role: UserRole

class InvitationCreate(InvitationBase):
    pass

class InvitationResponse(InvitationBase):
    id: uuid.UUID
    expires_at: datetime
    created_at: datetime
    used_at: Optional[datetime] = None
    used_by_user_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)

class InvitationAccept(BaseModel):
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    mobile_number: Optional[str] = None


# ----------------------------------------
# 11. Admin Audit Logs
# ----------------------------------------
class AdminLogResponse(BaseModel):
    id: uuid.UUID
    admin_id: Optional[uuid.UUID] = None
    action: str
    ip_address: Optional[str] = None
    before_data: Optional[Any] = None
    after_data: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# 12. Authentication (DTOs)
# ----------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    token: str
    password: str = Field(..., min_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: uuid.UUID
    email: str
    role: UserRole


# ----------------------------------------
# 13. Admin Statistics & Dashboard DTOs
# ----------------------------------------
class AdminStatsResponse(BaseModel):
    total_students: int
    total_parents: int
    total_admissions: int
    pending_admissions: int
    approved_admissions: int
    rejected_admissions: int
    total_messages: int
    unread_messages: int
    total_notifications: int

class PaginatedAdmissionsResponse(BaseModel):
    items: List[AdmissionResponse]
    total_count: int
    page: int
    pages: int
    limit: int

class PaginatedMessagesResponse(BaseModel):
    items: List[MessageResponse]
    total_count: int
    page: int
    pages: int
    limit: int

class PaginatedAuditLogsResponse(BaseModel):
    items: List[AdminLogResponse]
    total_count: int
    page: int
    pages: int
    limit: int

class AdminAnalyticsActivity(BaseModel):
    id: uuid.UUID
    action: str
    admin_name: str
    created_at: datetime

class AdminAnalyticsResponse(BaseModel):
    recent_admissions: List[AdmissionResponse]
    recent_messages: List[MessageResponse]
    recent_notifications: List[NotificationResponse]
    recent_activity: List[AdminAnalyticsActivity]


# ----------------------------------------
# 14. Multi-Factor Authentication DTOs
# ----------------------------------------
class MFASetupResponse(BaseModel):
    is_mfa_enabled: bool
    mfa_secret: str
    qr_code_uri: str

class MFAVerifyRequest(BaseModel):
    code: str

class loginMFAVerifyRequest(BaseModel):
    email: EmailStr
    password: str
    code: str


