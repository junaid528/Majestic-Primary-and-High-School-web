import uuid
from datetime import datetime, date, time, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, Date, Time, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, SoftDeleteMixin
from .enums import SchoolClass


# Future placeholder: school_classes table
class SchoolClassModel(Base, SoftDeleteMixin):
    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[SchoolClass] = mapped_column(SQLEnum(SchoolClass), nullable=False)
    section: Mapped[str] = mapped_column(String(10), default="A", nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False)
    class_teacher_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


# Future placeholder: attendance
class Attendance(Base, SoftDeleteMixin):
    __tablename__ = "attendance"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="Present", nullable=False) # Present, Absent, Tardive, Excused
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


# Future placeholder: fee_categories
class FeeCategory(Base, SoftDeleteMixin):
    __tablename__ = "fee_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False) # e.g. "Tuition Fees", "Bus Facility"
    amount: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# Future placeholder: student_fee_bills
class StudentFeeBill(Base, SoftDeleteMixin):
    __tablename__ = "student_fee_bills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    fee_category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fee_categories.id", ondelete="RESTRICT"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False)
    
    total_amount: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), default=0.0, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Unpaid", nullable=False) # Unpaid, Partially Paid, Fully Paid, Overdue
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# Future placeholder: fee_payments
class FeePayment(Base):
    __tablename__ = "fee_payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fee_bill_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("student_fee_bills.id", ondelete="RESTRICT"), nullable=False)
    amount_paid: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False) # UPI, Cash, Card, Bank NetTransfer
    transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True)
    payment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False) # Pending, Complete, Failed


# Future placeholder: subjects
class Subject(Base, SoftDeleteMixin):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Mathematics, Science
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False) # e.g. MATH101
    class_level: Mapped[SchoolClass] = mapped_column(SQLEnum(SchoolClass), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# Future placeholder: exams
class Exam(Base, SoftDeleteMixin):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Mid-Term, Annual Exams
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)


# Future placeholder: exam_marks
class ExamMark(Base, SoftDeleteMixin):
    __tablename__ = "exam_marks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    
    marks_obtained: Mapped[float] = mapped_column(Numeric(precision=5, scale=2), nullable=False)
    max_marks: Mapped[float] = mapped_column(Numeric(precision=5, scale=2), default=100.0, nullable=False)
    grade: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


# Future placeholder: timetables
class Timetable(Base, SoftDeleteMixin):
    __tablename__ = "timetables"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    day_of_week: Mapped[str] = mapped_column(String(15), nullable=False) # e.g. Monday, Tuesday
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    classroom: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
