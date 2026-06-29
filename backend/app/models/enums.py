import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "Super Admin"
    STAFF = "Staff"
    STUDENT = "Student"
    PARENT = "Parent"

class AdmissionStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class StudentStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    SUSPENDED = "Suspended"

class SchoolClass(str, enum.Enum):
    PRE_KG = "PRE-KG"
    LKG = "LKG"
    UKG = "UKG"
    CLASS_I = "Class I"
    CLASS_II = "Class II"
    CLASS_III = "Class III"
    CLASS_IV = "Class IV"
    CLASS_V = "Class V"
    CLASS_VI = "Class VI"
    CLASS_VII = "Class VII"
    CLASS_VIII = "Class VIII"
    CLASS_IX = "Class IX"
    CLASS_X = "Class X"

class NotificationType(str, enum.Enum):
    USER_REGISTERED = "USER_REGISTERED"
    NEW_ADMISSION = "NEW_ADMISSION"
    ADMISSION_UPDATED = "ADMISSION_UPDATED"
    NEW_MESSAGE = "NEW_MESSAGE"
    ALERT = "ALERT"
