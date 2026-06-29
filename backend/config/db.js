const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
const isProductionPG = !!(process.env.DATABASE_URL || process.env.PGHOST);

// Local JSON persistent storage path for preview/dev fallback
const localDbPath = path.join(__dirname, '..', 'data', 'database.json');

// Initialize local fallback database
const initLocalDb = () => {
    const parentDir = path.dirname(localDbPath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(localDbPath) || fs.statSync(localDbPath).size === 0) {
        const initialSchema = {
            users: [
                // Injected Default Admin
                {
                    id: 1,
                    name: 'Super Admin',
                    email: 'mohammedjunaidk01@gmail.com',
                    mobileNumber: '7892053860',
                    password: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // bcrypt hash for 'admin123'
                    role: 'Super Admin',
                    status: 'Active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Majestic Admin',
                    email: 'majestichps@gmail.com',
                    mobileNumber: '7892053861',
                    password: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // bcrypt hash for 'admin123'
                    role: 'Super Admin',
                    status: 'Active',
                    created_at: new Date().toISOString()
                }
            ],
            students: [],
            admissions: [],
            messages: [],
            announcements: [
                {
                    id: 1,
                    title: 'Admissions Open for Academic Year 2026-27',
                    description: 'Online registration and prospectus kits are available for Nursery to Class IX intake cycles.',
                    category: 'Admissions',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'SSLC 100% Results Celebration',
                    description: 'Congratulations to our outstanding students and educators for securing 100% passes with highest score 599/625.',
                    category: 'Academic',
                    created_at: new Date().toISOString()
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Annual Sports Meet 2026',
                    date: '2026-06-15',
                    location: 'Main School Grounds',
                    description: 'Inter-house athletic meets and award ceremonies to foster sportsmanship.',
                    created_at: new Date().toISOString()
                }
            ],
            uploads: [],
            admin_logs: [],
            notifications: [],
            teachers: [
                {
                    id: 1,
                    teacher_id: "TCH001",
                    employee_code: "EMP201",
                    full_name: "Ananya Sharma",
                    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
                    gender: "Female",
                    dob: "1988-04-12",
                    qualification: "M.Sc in Mathematics, B.Ed",
                    experience: "8 Years",
                    subject: "Mathematics",
                    assigned_class: "Class X",
                    mobile_number: "9876543210",
                    email: "ananya.math@school.edu",
                    address: "#24, Springdale Layout, Mysore",
                    joining_date: "2019-06-01",
                    salary: "45000",
                    aadhaar_number: "123456789012",
                    status: "Active",
                    username: "ananya_math",
                    password: "$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW",
                    documents: JSON.stringify(["Aadhaar_Card.pdf", "Degree_Certificate.pdf"]),
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    teacher_id: "TCH002",
                    employee_code: "EMP202",
                    full_name: "Rajesh Kumar",
                    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120",
                    gender: "Male",
                    dob: "1984-09-23",
                    qualification: "M.A in English, M.Ed",
                    experience: "12 Years",
                    subject: "English",
                    assigned_class: "Class IX",
                    mobile_number: "9876543211",
                    email: "rajesh.eng@school.edu",
                    address: "#105, Hebbal Industrial Area, Mysore",
                    joining_date: "2016-11-15",
                    salary: "52000",
                    aadhaar_number: "234567890123",
                    status: "Active",
                    username: "rajesh_eng",
                    password: "$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW",
                    documents: JSON.stringify(["Degree_Certificate.pdf"]),
                    created_at: new Date().toISOString()
                }
            ],
            classrooms: [
                {
                    id: 1,
                    class_name: "PRE-KG",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room P1",
                    capacity: 25,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    class_name: "LKG",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room L1",
                    capacity: 30,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    class_name: "UKG",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room U1",
                    capacity: 30,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    class_name: "Class I",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 101",
                    capacity: 35,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 5,
                    class_name: "Class II",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 102",
                    capacity: 35,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 6,
                    class_name: "Class III",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 103",
                    capacity: 35,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 7,
                    class_name: "Class IV",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 104",
                    capacity: 35,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 8,
                    class_name: "Class V",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 105",
                    capacity: 35,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 9,
                    class_name: "Class VI",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 106",
                    capacity: 40,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 10,
                    class_name: "Class VII",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 107",
                    capacity: 40,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 11,
                    class_name: "Class VIII",
                    section: "A",
                    class_teacher: "None",
                    room_number: "Room 108",
                    capacity: 40,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 12,
                    class_name: "Class IX",
                    section: "B",
                    class_teacher: "Rajesh Kumar",
                    room_number: "Room 102",
                    capacity: 40,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 13,
                    class_name: "Class X",
                    section: "A",
                    class_teacher: "Ananya Sharma",
                    room_number: "Room 101",
                    capacity: 40,
                    academic_year: "2026-27",
                    status: "Active",
                    created_at: new Date().toISOString()
                }
            ],
            subjects: [
                {
                    id: 1,
                    subject_name: "Mathematics",
                    subject_code: "MATH101",
                    class_name: "Class X",
                    teacher_assigned: "Ananya Sharma",
                    weekly_hours: 6,
                    description: "Advanced algebraic calculations and geometry theorems.",
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    subject_name: "English",
                    subject_code: "ENG102",
                    class_name: "Class IX",
                    teacher_assigned: "Rajesh Kumar",
                    weekly_hours: 4,
                    description: "English literature, prose comprehension and grammar outlines.",
                    status: "Active",
                    created_at: new Date().toISOString()
                }
            ],
            attendance: [
                {
                    id: 1,
                    student_name: "Rohan Gupta",
                    class_name: "Class X",
                    section: "A",
                    attendance_date: "2026-06-16",
                    status: "Present",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    student_name: "Neha Roy",
                    class_name: "Class IX",
                    section: "B",
                    attendance_date: "2026-06-16",
                    status: "Present",
                    created_at: new Date().toISOString()
                }
            ],
            exams: [
                {
                    id: 1,
                    exam_name: "Mid-Term Mathematics",
                    class_name: "Class X",
                    subject_name: "Mathematics",
                    exam_date: "2026-09-18",
                    start_time: "10:00",
                    end_time: "13:00",
                    max_marks: 100,
                    status: "Active",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    exam_name: "Quarterly English Exam",
                    class_name: "Class IX",
                    subject_name: "English",
                    exam_date: "2026-09-20",
                    start_time: "09:30",
                    end_time: "12:30",
                    max_marks: 100,
                    status: "Active",
                    created_at: new Date().toISOString()
                }
            ],
            results: [
                {
                    id: 1,
                    student_name: "Rohan Gupta",
                    class_name: "Class X",
                    subject_name: "Mathematics",
                    marks_obtained: 88,
                    max_marks: 100,
                    percentage: 88.00,
                    grade: "A",
                    remarks: "Exceptional visual logic and calculation optimization skills.",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    student_name: "Neha Roy",
                    class_name: "Class IX",
                    subject_name: "English",
                    marks_obtained: 92,
                    max_marks: 100,
                    percentage: 92.00,
                    grade: "A",
                    remarks: "Outstanding comprehension, critical interpretation, and grammar skills.",
                    created_at: new Date().toISOString()
                }
            ],
            timetables: [
                // Class 1 Seeds - Monday
                { id: 1, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Assembly', start_time: '09:45 AM', end_time: '10:00 AM', subject_name: 'Morning Prayer', teacher_name: 'Archana S.' },
                { id: 2, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 1', start_time: '10:00 AM', end_time: '10:40 AM', subject_name: 'English Literature', teacher_name: 'Ananya Mishra' },
                { id: 3, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 2', start_time: '10:40 AM', end_time: '11:20 AM', subject_name: 'Mathematics', teacher_name: 'Vikram Dev' },
                { id: 4, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 3', start_time: '11:20 AM', end_time: '12:00 PM', subject_name: 'EVS Foundation', teacher_name: 'Kiran Kumar' },
                { id: 5, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 4', start_time: '12:00 PM', end_time: '12:40 PM', subject_name: 'Kannada Language', teacher_name: 'Shashikala R.' },
                { id: 6, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Lunch Break', start_time: '12:40 PM', end_time: '01:20 PM', subject_name: 'Mid-day Break', teacher_name: 'Duty Teacher' },
                { id: 7, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 5', start_time: '01:20 PM', end_time: '02:00 PM', subject_name: 'Art & Craft', teacher_name: 'Sneha M.' },
                { id: 8, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 6', start_time: '02:00 PM', end_time: '02:40 PM', subject_name: 'Hindi Language', teacher_name: 'Rekha Vyas' },
                { id: 9, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 7', start_time: '02:40 PM', end_time: '03:20 PM', subject_name: 'Physical Education', teacher_name: 'Ramesh Prasad' },
                { id: 10, class_name: 'Class 1', section: 'A', day_of_week: 'Monday', period_name: 'Period 8', start_time: '03:20 PM', end_time: '04:00 PM', subject_name: 'Mental Aptitude', teacher_name: 'Ananya Mishra' },
                
                // Class 1 Seeds - Friday Special Timetable
                { id: 11, class_name: 'Class 1', section: 'A', day_of_week: 'Friday', period_name: 'Period 1', start_time: '08:45 AM', end_time: '09:00 AM', subject_name: 'Class Reading', teacher_name: 'Ananya Mishra' },
                { id: 12, class_name: 'Class 1', section: 'A', day_of_week: 'Friday', period_name: 'Period 2', start_time: '09:00 AM', end_time: '09:40 AM', subject_name: 'Mathematics Review', teacher_name: 'Vikram Dev' },
                { id: 13, class_name: 'Class 1', section: 'A', day_of_week: 'Friday', period_name: 'Period 3', start_time: '09:40 AM', end_time: '10:20 AM', subject_name: 'Computer Skills', teacher_name: 'Sneha M.' },
                { id: 14, class_name: 'Class 1', section: 'A', day_of_week: 'Friday', period_name: 'Period 4', start_time: '10:20 AM', end_time: '11:00 AM', subject_name: 'English Drama', teacher_name: 'Ananya Mishra' },
                { id: 15, class_name: 'Class 1', section: 'A', day_of_week: 'Friday', period_name: 'Period 5', start_time: '11:00 AM', end_time: '11:40 AM', subject_name: 'Moral Stories', teacher_name: 'Kiran Kumar' },
                { id: 16, class_name: 'Class 1', section: 'A', day_of_week: 'Friday', period_name: 'Period 6', start_time: '11:40 AM', end_time: '12:20 PM', subject_name: 'Weekly Assessment', teacher_name: 'Ananya Mishra' },
                
                // Class 1 Seeds - Saturday Assembly Only
                { id: 17, class_name: 'Class 1', section: 'A', day_of_week: 'Saturday', period_name: 'Assembly', start_time: '09:00 AM', end_time: '10:00 AM', subject_name: 'General Assembly & Yoga', teacher_name: 'Archana S.' },

                // Class 9 Seeds - Monday
                { id: 18, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Assembly', start_time: '09:45 AM', end_time: '10:00 AM', subject_name: 'Assembly & News', teacher_name: 'Principal' },
                { id: 19, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 1', start_time: '10:00 AM', end_time: '10:40 AM', subject_name: 'Advanced Physics', teacher_name: 'Rajesh Gowda' },
                { id: 20, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 2', start_time: '10:40 AM', end_time: '11:20 AM', subject_name: 'Chemistry Theory', teacher_name: 'Meera Nair' },
                { id: 21, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 3', start_time: '11:20 AM', end_time: '12:00 PM', subject_name: 'Algebra & Geometry', teacher_name: 'Vikram Dev' },
                { id: 22, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 4', start_time: '12:00 PM', end_time: '12:40 PM', subject_name: 'English Literature', teacher_name: 'Ananya Mishra' },
                { id: 23, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Lunch Break', start_time: '12:40 PM', end_time: '01:20 PM', subject_name: 'Recess', teacher_name: 'Campus Duty' },
                { id: 24, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 5', start_time: '01:20 PM', end_time: '02:00 PM', subject_name: 'Biology Lab', teacher_name: 'Meera Nair' },
                { id: 25, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 6', start_time: '02:00 PM', end_time: '02:40 PM', subject_name: 'Social Science', teacher_name: 'Kiran Kumar' },
                { id: 26, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 7', start_time: '02:40 PM', end_time: '03:20 PM', subject_name: 'Computer Programming', teacher_name: 'Rajesh Gowda' },
                { id: 27, class_name: 'Class 9', section: 'A', day_of_week: 'Monday', period_name: 'Period 8', start_time: '03:20 PM', end_time: '04:00 PM', subject_name: 'Physical Training', teacher_name: 'Ramesh Prasad' },

                // Class 9 Seeds - Friday
                { id: 28, class_name: 'Class 9', section: 'A', day_of_week: 'Friday', period_name: 'Period 1', start_time: '08:45 AM', end_time: '09:00 AM', subject_name: 'Current Affairs Quiz', teacher_name: 'Kiran Kumar' },
                { id: 29, class_name: 'Class 9', section: 'A', day_of_week: 'Friday', period_name: 'Period 2', start_time: '09:00 AM', end_time: '09:40 AM', subject_name: 'Advanced Algebra', teacher_name: 'Vikram Dev' },
                { id: 30, class_name: 'Class 9', section: 'A', day_of_week: 'Friday', period_name: 'Period 3', start_time: '09:40 AM', end_time: '10:20 AM', subject_name: 'Physics Laboratory', teacher_name: 'Rajesh Gowda' },
                { id: 31, class_name: 'Class 9', section: 'A', day_of_week: 'Friday', period_name: 'Period 4', start_time: '10:20 AM', end_time: '11:00 AM', subject_name: 'Social Science Study', teacher_name: 'Kiran Kumar' },
                { id: 32, class_name: 'Class 9', section: 'A', day_of_week: 'Friday', period_name: 'Period 5', start_time: '11:00 AM', end_time: '11:40 AM', subject_name: 'Chemistry Practical', teacher_name: 'Meera Nair' },
                { id: 33, class_name: 'Class 9', section: 'A', day_of_week: 'Friday', period_name: 'Period 6', start_time: '11:40 AM', end_time: '12:20 PM', subject_name: 'Weekly Mock Test', teacher_name: 'Rajesh Gowda' },

                // Class 9 Seeds - Saturday
                { id: 34, class_name: 'Class 9', section: 'A', day_of_week: 'Saturday', period_name: 'Assembly', start_time: '09:00 AM', end_time: '10:00 AM', subject_name: 'Special Guidance Forum', teacher_name: 'Principal' }
            ],
            academic_results: [
                {
                    id: 1,
                    academic_year: "2025-26",
                    class_name: "Class 1",
                    section: "A",
                    total_students: 40,
                    students_present: 38,
                    students_absent: 2,
                    students_passed: 36,
                    students_failed: 4,
                    pass_percentage: 90.00,
                    distinction_count: 12,
                    first_class_count: 15,
                    second_class_count: 9,
                    grade_A_count: 12,
                    grade_B_count: 15,
                    grade_C_count: 9,
                    grade_D_count: 0,
                    grade_F_count: 4,
                    topper_name: "Advait Sharma",
                    topper_marks: 98.20,
                    average_marks: 78.50,
                    remarks: "Excellent mathematical computation. High participation in moral classes."
                },
                {
                    id: 2,
                    academic_year: "2025-26",
                    class_name: "Class 5",
                    section: "A",
                    total_students: 35,
                    students_present: 35,
                    students_absent: 0,
                    students_passed: 34,
                    students_failed: 1,
                    pass_percentage: 97.14,
                    distinction_count: 15,
                    first_class_count: 12,
                    second_class_count: 7,
                    grade_A_count: 15,
                    grade_B_count: 12,
                    grade_C_count: 7,
                    grade_D_count: 0,
                    grade_F_count: 1,
                    topper_name: "Priyanshu Sen",
                    topper_marks: 99.00,
                    average_marks: 84.10,
                    remarks: "Scientific experimentation and environmental studies projects are highly graded."
                },
                {
                    id: 3,
                    academic_year: "2025-26",
                    class_name: "Class 9",
                    section: "A",
                    total_students: 45,
                    students_present: 45,
                    students_absent: 0,
                    students_passed: 42,
                    students_failed: 3,
                    pass_percentage: 93.33,
                    distinction_count: 10,
                    first_class_count: 22,
                    second_class_count: 10,
                    grade_A_count: 10,
                    grade_B_count: 22,
                    grade_C_count: 10,
                    grade_D_count: 0,
                    grade_F_count: 3,
                    topper_name: "Deepisree R.",
                    topper_marks: 96.50,
                    average_marks: 76.20,
                    remarks: "ICT programming performance is exemplary. Science labs need support."
                }
            ],
            school_timings: [
                { id: 1, period_name: 'Assembly', start_time: '08:30 AM', end_time: '08:45 AM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, period_name: 'Period 1', start_time: '08:45 AM', end_time: '09:30 AM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 3, period_name: 'Period 2', start_time: '09:30 AM', end_time: '10:15 AM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 4, period_name: 'Period 3', start_time: '10:15 AM', end_time: '11:00 AM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 5, period_name: 'Period 4', start_time: '11:00 AM', end_time: '11:45 AM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 6, period_name: 'Lunch Break', start_time: '11:45 AM', end_time: '12:30 PM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 7, period_name: 'Period 5', start_time: '12:30 PM', end_time: '01:15 PM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 8, period_name: 'Period 6', start_time: '01:15 PM', end_time: '02:00 PM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 9, period_name: 'Period 7', start_time: '02:00 PM', end_time: '02:45 PM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 10, period_name: 'Period 8', start_time: '02:45 PM', end_time: '03:30 PM', day_type: 'Regular', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ],
            settings: [
                { id: 1, key: 'school_name', value: 'Majestic Primary & High School', updated_at: new Date().toISOString(), updated_by: 'System' },
                { id: 2, key: 'academic_year', value: '2026-27', updated_at: new Date().toISOString(), updated_by: 'System' },
                { id: 3, key: 'grade_low_attendance_threshold', value: '75.00', updated_at: new Date().toISOString(), updated_by: 'System' },
                { id: 4, key: 'grade_distinction_threshold', value: '85.00', updated_at: new Date().toISOString(), updated_by: 'System' },
                { id: 5, key: 'grade_pass_threshold', value: '35.00', updated_at: new Date().toISOString(), updated_by: 'System' },
                { id: 6, key: 'logo_url', value: 'assets/logo.png', updated_at: new Date().toISOString(), updated_by: 'System' }
            ],
            staff: [
                { id: 1, employee_code: 'STF001', first_name: 'Anil', last_name: 'Prasad', role: 'Staff', department: 'Finance', designation: 'Finance Officer', qualification: 'MBA in Finance', joining_date: '2020-05-10', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, employee_code: 'STF002', first_name: 'Sunita', last_name: 'Rao', role: 'Staff', department: 'HR', designation: 'HR Manager', qualification: 'MBA in HR', joining_date: '2021-03-15', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 3, employee_code: 'STF003', first_name: 'John', last_name: 'Danie', role: 'Staff', department: 'Admissions', designation: 'Head of Admissions', qualification: 'M.Com', joining_date: '2019-11-01', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 4, employee_code: 'STF004', first_name: 'Mary', last_name: 'Dsa', role: 'Staff', department: 'Operations', designation: 'General Clerk', qualification: 'B.A.', joining_date: '2022-01-20', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 5, employee_code: 'STF005', first_name: 'Srinivas', last_name: 'Murthy', role: 'Staff', department: 'IT', designation: 'IT Administrator', qualification: 'B.E. in CS', joining_date: '2018-08-12', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 6, employee_code: 'STF006', first_name: 'Kavitha', last_name: 'Sharma', role: 'Staff', department: 'Library', designation: 'Librarian', qualification: 'M.Lib.Sc', joining_date: '2017-06-01', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 7, employee_code: 'STF007', first_name: 'Peter', last_name: 'Rego', role: 'Staff', department: 'Administration', designation: 'Vice Principal', qualification: 'M.A., B.Ed', joining_date: '2015-04-01', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 8, employee_code: 'STF008', first_name: 'Rupa', last_name: 'Sen', role: 'Staff', department: 'Reception', designation: 'Front Desk Officer', qualification: 'B.Sc.', joining_date: '2023-09-01', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ],
            assignments: [],
            assignment_submissions: [],
            substitutions: []
        };
        fs.writeFileSync(localDbPath, JSON.stringify(initialSchema, null, 2));
    }
};

const getLocalDb = () => {
    initLocalDb();
    let data;
    try {
        data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    } catch (e) {
        console.warn('Local database file empty or corrupt, re-initializing...', e.message);
        // Clean/reset the empty file first to force initialization 
        try { fs.unlinkSync(localDbPath); } catch (_) {}
        initLocalDb();
        data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    }
    
    // Ensure all schema arrays exist to avoid Undefined/TypeError crashes
    const collections = ['users', 'students', 'parents', 'admissions', 'messages', 'announcements', 'events', 'uploads', 'admin_logs', 'notifications', 'teachers', 'classrooms', 'subjects', 'attendance', 'exams', 'results', 'campus_settings', 'timetables', 'academic_results', 'school_timings', 'attendance_summary', 'student_attendance', 'security_settings', 'settings', 'staff', 'assignments', 'assignment_submissions', 'substitutions'];
    let modified = false;
    collections.forEach(col => {
        if (!data[col]) {
            data[col] = [];
            modified = true;
        }
    });

    if (data.users) {
        const hasMajestic = data.users.some(u => u.email === 'majestichps@gmail.com');
        if (!hasMajestic) {
            const nextId = data.users.reduce((max, u) => u.id > max ? u.id : max, 0) + 1;
            data.users.push({
                id: nextId,
                name: 'Majestic Admin',
                email: 'majestichps@gmail.com',
                mobileNumber: '7892053861',
                password: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // 'admin123'
                role: 'Super Admin',
                status: 'Active',
                created_at: new Date().toISOString()
            });
            modified = true;
        }

        data.users.forEach(u => {
            if (!u.status) {
                u.status = u.role === 'Super Admin' || u.role === 'Staff' ? 'Active' : 'Pending';
                modified = true;
            }
        });
    }

    if (data.security_settings && data.security_settings.length === 0) {
        data.security_settings.push({
            id: 1,
            security_password_hash: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // 'admin123'
            updated_by: 'System',
            updated_at: new Date().toISOString()
        });
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
    }
    return data;
};

const saveLocalDb = (data) => {
    initLocalDb();
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
};

// PostgreSQL schema initialization statements
const pgSchemaSql = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        mobile_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Student',
        status VARCHAR(50) DEFAULT 'Pending',
        reset_token VARCHAR(255),
        reset_expiry TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admissions (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        parent_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        class_applied VARCHAR(50) NOT NULL,
        address TEXT,
        previous_school TEXT,
        remarks TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        student_photo VARCHAR(255),
        aadhaar VARCHAR(255),
        transfer_certificate VARCHAR(255),
        marks_card VARCHAR(255),
        gender VARCHAR(20) DEFAULT 'Not Specified',
        assigned_section VARCHAR(20) DEFAULT 'Mixed',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        admission_id INTEGER REFERENCES admissions(id) ON DELETE SET NULL,
        academic_year VARCHAR(20) DEFAULT '2026-27',
        class VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        parent_name VARCHAR(100),
        student_id VARCHAR(50) UNIQUE,
        admission_number VARCHAR(50),
        full_name VARCHAR(100),
        section VARCHAR(20),
        gender VARCHAR(20),
        dob VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        roll_number VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parents (
        id SERIAL PRIMARY KEY,
        parent_id VARCHAR(50) UNIQUE NOT NULL,
        father_name VARCHAR(100) NOT NULL,
        mother_name VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100) UNIQUE,
        address TEXT,
        linked_students TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(150),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'Open',
        reply_message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        date DATE NOT NULL,
        location VARCHAR(150),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(255) NOT NULL,
        filetype VARCHAR(100),
        parent_type VARCHAR(50),
        parent_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER,
        action TEXT NOT NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        teacher_id VARCHAR(50) UNIQUE NOT NULL,
        employee_code VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        photo VARCHAR(255),
        gender VARCHAR(20),
        dob VARCHAR(20),
        qualification VARCHAR(255),
        experience VARCHAR(50),
        subject VARCHAR(100),
        assigned_class VARCHAR(50),
        mobile_number VARCHAR(20),
        email VARCHAR(100) UNIQUE NOT NULL,
        address TEXT,
        joining_date VARCHAR(20),
        salary VARCHAR(50),
        aadhaar_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        username VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        documents TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classrooms (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(100) NOT NULL,
        section VARCHAR(50),
        class_teacher VARCHAR(100),
        room_number VARCHAR(50),
        capacity INTEGER,
        academic_year VARCHAR(20) DEFAULT '2026-27',
        status VARCHAR(50) DEFAULT 'Active',
        advisor_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        subject_name VARCHAR(100) NOT NULL,
        subject_code VARCHAR(50) UNIQUE NOT NULL,
        class_name VARCHAR(100),
        teacher_assigned VARCHAR(100),
        weekly_hours INTEGER,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(100),
        section VARCHAR(50),
        attendance_date VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'Present',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_summary (
        id SERIAL PRIMARY KEY,
        attendance_date VARCHAR(20) NOT NULL,
        academic_year VARCHAR(50) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        section VARCHAR(50) NOT NULL,
        class_teacher VARCHAR(100),
        total_students INTEGER DEFAULT 0,
        present_students INTEGER DEFAULT 0,
        absent_students INTEGER DEFAULT 0,
        attendance_percentage NUMERIC(5,2) DEFAULT 0.00,
        remarks TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_attendance (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        attendance_date VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'Present',
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        exam_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(100),
        subject_name VARCHAR(100),
        exam_date VARCHAR(20),
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        max_marks INTEGER,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(100),
        subject_name VARCHAR(100),
        marks_obtained INTEGER,
        max_marks INTEGER,
        percentage NUMERIC(5,2),
        grade VARCHAR(10),
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campus_settings (
        id SERIAL PRIMARY KEY,
        school_name VARCHAR(200) NOT NULL,
        school_motto VARCHAR(200),
        academic_year VARCHAR(20) DEFAULT '2026/27',
        support_email VARCHAR(100),
        support_phone VARCHAR(50),
        campus_address TEXT,
        website_url VARCHAR(150),
        logo_url VARCHAR(255),
        theme_settings VARCHAR(50) DEFAULT 'light',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS school_timings (
        id SERIAL PRIMARY KEY,
        period_name VARCHAR(100) NOT NULL UNIQUE,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        day_type VARCHAR(50) DEFAULT 'Regular',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timetables (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(100) NOT NULL,
        section VARCHAR(50) DEFAULT 'A',
        day_of_week VARCHAR(15) NOT NULL,
        period_name VARCHAR(50) NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        subject_name VARCHAR(100),
        teacher_name VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS academic_results (
        id SERIAL PRIMARY KEY,
        academic_year VARCHAR(20) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        section VARCHAR(50) DEFAULT 'A',
        total_students INTEGER DEFAULT 0,
        students_present INTEGER DEFAULT 0,
        students_absent INTEGER DEFAULT 0,
        students_passed INTEGER DEFAULT 0,
        students_failed INTEGER DEFAULT 0,
        pass_percentage NUMERIC(5,2) DEFAULT 0.00,
        distinction_count INTEGER DEFAULT 0,
        first_class_count INTEGER DEFAULT 0,
        second_class_count INTEGER DEFAULT 0,
        grade_A_count INTEGER DEFAULT 0,
        grade_B_count INTEGER DEFAULT 0,
        grade_C_count INTEGER DEFAULT 0,
        grade_D_count INTEGER DEFAULT 0,
        grade_F_count INTEGER DEFAULT 0,
        topper_name VARCHAR(100),
        topper_marks NUMERIC(6,2) DEFAULT 0.00,
        average_marks NUMERIC(6,2) DEFAULT 0.00,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS security_settings (
        id SERIAL PRIMARY KEY,
        security_password_hash VARCHAR(255) NOT NULL,
        updated_by VARCHAR(100),
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        employee_code VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(50) NOT NULL,
        designation VARCHAR(100) NOT NULL,
        qualification VARCHAR(100),
        joining_date DATE NOT NULL,
        status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Suspended', 'Terminated')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(50) NOT NULL,
        section VARCHAR(20) NOT NULL,
        subject VARCHAR(50) NOT NULL,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        max_points INTEGER DEFAULT 100,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assignment_submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        student_id VARCHAR(50) NOT NULL,
        submission_date TIMESTAMPTZ DEFAULT NOW(),
        content TEXT,
        points_obtained INTEGER,
        feedback TEXT,
        status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Late')),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS substitutions (
        id SERIAL PRIMARY KEY,
        original_teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        substitute_teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        class_name VARCHAR(50) NOT NULL,
        section VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        period_name VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
`;

const initializeDatabase = async () => {
    if (isProductionPG) {
        try {
            console.log('Connecting to PostgreSQL database...', process.env.DATABASE_URL ? 'URL supplied' : 'Host configuration supplied');
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWORD,
                database: process.env.PGDATABASE,
                port: process.env.PGPORT || 5432,
                ssl: { rejectUnauthorized: false }
            });

            // Run table migrations on postgres
            await pool.query(pgSchemaSql);
            console.log('PostgreSQL database tables initialized successfully.');

            // Backward compatibility: add columns if table already existed
            const addColQueries = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS dob VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(100);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS remarks TEXT;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(50) UNIQUE DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50) UNIQUE DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo VARCHAR(255) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS dob VARCHAR(20) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS qualification VARCHAR(255) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS experience VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject VARCHAR(100) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS assigned_class VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS joining_date VARCHAR(20) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS salary VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT NULL;",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS documents TEXT DEFAULT NULL;",
                "ALTER TABLE messages ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Open';",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Not Specified';",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS assigned_section VARCHAR(20) DEFAULT 'Mixed';",
                "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS assigned_section VARCHAR(20) DEFAULT NULL;",
                "ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS advisor_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS dob VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS applying_for_class VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(100) DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50) DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS parent_email VARCHAR(100) DEFAULT NULL;",
                "ALTER TABLE admissions ADD COLUMN IF NOT EXISTS inquiry_date DATE DEFAULT CURRENT_DATE;",
                "ALTER TABLE attendance_summary ADD COLUMN IF NOT EXISTS class_teacher VARCHAR(100) DEFAULT NULL;",
                "ALTER TABLE attendance_summary ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT NULL;",
                "ALTER TABLE attendance_summary ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT NULL;"
            ];
            for (const q of addColQueries) {
                await pool.query(q).catch(e => console.log('Migration column addition note:', e.message));
            }

            // Insert default Super Admin if not exists
            const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['mohammedjunaidk01@gmail.com']);
            if (adminCheck.rows.length === 0) {
                const adminPass = '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW'; // 'admin123'
                await pool.query(
                    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                    ['Super Admin', 'mohammedjunaidk01@gmail.com', adminPass, 'Super Admin']
                );
                console.log('PostgreSQL Super Admin default profile seeded.');
            }

            const majesticCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['majestichps@gmail.com']);
            if (majesticCheck.rows.length === 0) {
                const adminPass = '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW'; // 'admin123'
                await pool.query(
                    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                    ['Majestic Admin', 'majestichps@gmail.com', adminPass, 'Super Admin']
                );
                console.log('PostgreSQL Majestic Admin diagnostic profile seeded.');
            }

            // Seed teachers if empty
            const teacherCheck = await pool.query('SELECT * FROM teachers LIMIT 1');
            if (teacherCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO teachers (
                        teacher_id, employee_code, full_name, photo, gender, dob, qualification, 
                        experience, subject, assigned_class, mobile_number, email, address, 
                        joining_date, salary, aadhaar_number, status, username, password, documents
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                    ), (
                        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
                    )
                `, [
                    'TCH001', 'EMP201', 'Ananya Sharma', 
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120', 
                    'Female', '1988-04-12', 'M.Sc in Mathematics, B.Ed', '8 Years', 'Mathematics', 'Class X', 
                    '9876543210', 'ananya.math@school.edu', '#24, Springdale Layout, Mysore', '2019-06-01', 
                    '45000', '123456789012', 'Active', 'ananya_math', 
                    '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', JSON.stringify(['Aadhaar_Card.pdf', 'Degree_Certificate.pdf']),

                    'TCH002', 'EMP202', 'Rajesh Kumar', 
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120', 
                    'Male', '1984-09-23', 'M.A in English, M.Ed', '12 Years', 'English', 'Class IX', 
                    '9876543211', 'rajesh.eng@school.edu', '#105, Hebbal Industrial Area, Mysore', '2016-11-15', 
                    '52000', '234567890123', 'Active', 'rajesh_eng', 
                    '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', JSON.stringify(['Degree_Certificate.pdf'])
                ]);
                console.log('PostgreSQL default teachers seeded.');
            }

            // Seed classrooms if empty
            const classCheck = await pool.query('SELECT * FROM classrooms LIMIT 1');
            if (classCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO classrooms (class_name, section, class_teacher, room_number, capacity, academic_year, status)
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7),
                    ($8, $9, $10, $11, $12, $13, $14),
                    ($15, $16, $17, $18, $19, $20, $21),
                    ($22, $23, $24, $25, $26, $27, $28),
                    ($29, $30, $31, $32, $33, $34, $35),
                    ($36, $37, $38, $39, $40, $41, $42),
                    ($43, $44, $45, $46, $47, $48, $49),
                    ($50, $51, $52, $53, $54, $55, $56),
                    ($57, $58, $59, $60, $61, $62, $63),
                    ($64, $65, $66, $67, $68, $69, $70),
                    ($71, $72, $73, $74, $75, $76, $77),
                    ($78, $79, $80, $81, $82, $83, $84),
                    ($85, $86, $87, $88, $89, $90, $91)
                `, [
                    'PRE-KG', 'A', 'None', 'Room P1', 25, '2026-27', 'Active',
                    'LKG', 'A', 'None', 'Room L1', 30, '2026-27', 'Active',
                    'UKG', 'A', 'None', 'Room U1', 30, '2026-27', 'Active',
                    'Class I', 'A', 'None', 'Room 101', 35, '2026-27', 'Active',
                    'Class II', 'A', 'None', 'Room 102', 35, '2026-27', 'Active',
                    'Class III', 'A', 'None', 'Room 103', 35, '2026-27', 'Active',
                    'Class IV', 'A', 'None', 'Room 104', 35, '2026-27', 'Active',
                    'Class V', 'A', 'None', 'Room 105', 35, '2026-27', 'Active',
                    'Class VI', 'A', 'None', 'Room 106', 40, '2026-27', 'Active',
                    'Class VII', 'A', 'None', 'Room 107', 40, '2026-27', 'Active',
                    'Class VIII', 'A', 'None', 'Room 108', 40, '2026-27', 'Active',
                    'Class IX', 'B', 'Rajesh Kumar', 'Room 102', 40, '2026-27', 'Active',
                    'Class X', 'A', 'Ananya Sharma', 'Room 101', 40, '2026-27', 'Active'
                ]);
                console.log('PostgreSQL default classrooms seeded.');
            }

            // Seed subjects if empty
            const subjCheck = await pool.query('SELECT * FROM subjects LIMIT 1');
            if (subjCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO subjects (subject_name, subject_code, class_name, teacher_assigned, weekly_hours, description, status)
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7),
                    ($8, $9, $10, $11, $12, $13, $14)
                `, [
                    'Mathematics', 'MATH101', 'Class X', 'Ananya Sharma', 6, 'Advanced algebraic calculations and geometry theorems.', 'Active',
                    'English', 'ENG102', 'Class IX', 'Rajesh Kumar', 4, 'English literature, prose comprehension and grammar outlines.', 'Active'
                ]);
                console.log('PostgreSQL default subjects seeded.');
            }

            // Seed attendance if empty
            const attCheck = await pool.query('SELECT * FROM attendance LIMIT 1');
            if (attCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO attendance (student_name, class_name, section, attendance_date, status)
                    VALUES 
                    ($1, $2, $3, $4, $5),
                    ($6, $7, $8, $9, $10)
                `, [
                    'Rohan Gupta', 'Class X', 'A', '2026-06-16', 'Present',
                    'Neha Roy', 'Class IX', 'B', '2026-06-16', 'Present'
                ]);
                console.log('PostgreSQL default attendance records seeded.');
            }

            // Seed exams if empty
            const examCheck = await pool.query('SELECT * FROM exams LIMIT 1');
            if (examCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO exams (exam_name, class_name, subject_name, exam_date, start_time, end_time, max_marks, status)
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8),
                    ($9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    'Mid-Term Mathematics', 'Class X', 'Mathematics', '2026-09-18', '10:00', '13:00', 100, 'Active',
                    'Quarterly English Exam', 'Class IX', 'English', '2026-09-20', '09:30', '12:30', 100, 'Active'
                ]);
                console.log('PostgreSQL default exams seeded.');
            }

            // Seed results if empty
            const resCheck = await pool.query('SELECT * FROM results LIMIT 1');
            if (resCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO results (student_name, class_name, subject_name, marks_obtained, max_marks, percentage, grade, remarks)
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8),
                    ($9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    'Rohan Gupta', 'Class X', 'Mathematics', 88, 100, 88.00, 'A', 'Exceptional visual logic and calculation optimization skills.',
                    'Neha Roy', 'Class IX', 'English', 92, 100, 92.00, 'A', 'Outstanding comprehension, critical interpretation, and grammar skills.'
                ]);
                console.log('PostgreSQL default results seeded.');
            }

            // Seed Timetables if empty
            const timetableCheck = await pool.query('SELECT * FROM timetables LIMIT 1');
            if (timetableCheck.rows.length === 0) {
                // Let's seed Monday to Thursday standard assemblies and classes
                const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
                
                // Seed for Class 1 lessons
                for (const day of weekdays) {
                    await pool.query(`
                        INSERT INTO timetables (class_name, section, day_of_week, period_name, start_time, end_time, subject_name, teacher_name)
                        VALUES 
                        ('Class 1', 'A', $1, 'Assembly', '09:45 AM', '10:00 AM', 'Morning Prayer', 'Archana S.'),
                        ('Class 1', 'A', $1, 'Period 1', '10:00 AM', '10:40 AM', 'English Literature', 'Ananya Mishra'),
                        ('Class 1', 'A', $1, 'Period 2', '10:40 AM', '11:20 AM', 'Mathematics', 'Vikram Dev'),
                        ('Class 1', 'A', $1, 'Period 3', '11:20 AM', '12:00 PM', 'EVS Foundation', 'Kiran Kumar'),
                        ('Class 1', 'A', $1, 'Period 4', '12:00 PM', '12:40 PM', 'Kannada Language', 'Shashikala R.'),
                        ('Class 1', 'A', $1, 'Lunch Break', '12:40 PM', '01:20 PM', 'Mid-day Break', 'Duty Teacher'),
                        ('Class 1', 'A', $1, 'Period 5', '01:20 PM', '02:00 PM', 'Art & Craft', 'Sneha M.'),
                        ('Class 1', 'A', $1, 'Period 6', '02:00 PM', '02:40 PM', 'Hindi Language', 'Rekha Vyas'),
                        ('Class 1', 'A', $1, 'Period 7', '02:40 PM', '03:20 PM', 'Physical Education', 'Ramesh Prasad'),
                        ('Class 1', 'A', $1, 'Period 8', '03:20 PM', '04:00 PM', 'Mental Aptitude', 'Ananya Mishra')
                    `, [day]);
                }

                // Friday Special Timetable for Class 1
                await pool.query(`
                    INSERT INTO timetables (class_name, section, day_of_week, period_name, start_time, end_time, subject_name, teacher_name)
                    VALUES 
                    ('Class 1', 'A', 'Friday', 'Period 1', '08:45 AM', '09:00 AM', 'Class Reading', 'Ananya Mishra'),
                    ('Class 1', 'A', 'Friday', 'Period 2', '09:00 AM', '09:40 AM', 'Mathematics Review', 'Vikram Dev'),
                    ('Class 1', 'A', 'Friday', 'Period 3', '09:40 AM', '10:20 AM', 'Computer Skills', 'Sneha M.'),
                    ('Class 1', 'A', 'Friday', 'Period 4', '10:20 AM', '11:00 AM', 'English Drama', 'Ananya Mishra'),
                    ('Class 1', 'A', 'Friday', 'Period 5', '11:00 AM', '11:40 AM', 'Moral Stories', 'Kiran Kumar'),
                    ('Class 1', 'A', 'Friday', 'Period 6', '11:40 AM', '12:20 PM', 'Weekly Assessment', 'Ananya Mishra')
                `);

                // Saturday for Class 1 (Assembly with timings matching 9 to 10 AM as default according to guidelines)
                await pool.query(`
                    INSERT INTO timetables (class_name, section, day_of_week, period_name, start_time, end_time, subject_name, teacher_name)
                    VALUES 
                    ('Class 1', 'A', 'Saturday', 'Assembly', '09:00 AM', '10:00 AM', 'General Assembly & Yoga', 'Archana S.')
                `);

                // Let's seed Class 9 lessons
                for (const day of weekdays) {
                    await pool.query(`
                        INSERT INTO timetables (class_name, section, day_of_week, period_name, start_time, end_time, subject_name, teacher_name)
                        VALUES 
                        ('Class 9', 'A', $1, 'Assembly', '09:45 AM', '10:00 AM', 'Assembly & News', 'Principal'),
                        ('Class 9', 'A', $1, 'Period 1', '10:00 AM', '10:40 AM', 'Advanced Physics', 'Rajesh Gowda'),
                        ('Class 9', 'A', $1, 'Period 2', '10:40 AM', '11:20 AM', 'Chemistry Theory', 'Meera Nair'),
                        ('Class 9', 'A', $1, 'Period 3', '11:20 AM', '12:00 PM', 'Algebra & Geometry', 'Vikram Dev'),
                        ('Class 9', 'A', $1, 'Period 4', '12:00 PM', '12:40 PM', 'English Literature', 'Ananya Mishra'),
                        ('Class 9', 'A', $1, 'Lunch Break', '12:40 PM', '01:20 PM', 'Recess', 'Campus Duty'),
                        ('Class 9', 'A', $1, 'Period 5', '01:20 PM', '02:00 PM', 'Biology Lab', 'Meera Nair'),
                        ('Class 9', 'A', $1, 'Period 6', '02:00 PM', '02:40 PM', 'Social Science', 'Kiran Kumar'),
                        ('Class 9', 'A', $1, 'Period 7', '02:40 PM', '03:20 PM', 'Computer Programming', 'Rajesh Gowda'),
                        ('Class 9', 'A', $1, 'Period 8', '03:20 PM', '04:00 PM', 'Physical Training', 'Ramesh Prasad')
                    `, [day]);
                }

                // Friday Special Timetable for Class 9
                await pool.query(`
                    INSERT INTO timetables (class_name, section, day_of_week, period_name, start_time, end_time, subject_name, teacher_name)
                    VALUES 
                    ('Class 9', 'A', 'Friday', 'Period 1', '08:45 AM', '09:00 AM', 'Current Affairs Quiz', 'Kiran Kumar'),
                    ('Class 9', 'A', 'Friday', 'Period 2', '09:00 AM', '09:40 AM', 'Advanced Algebra', 'Vikram Dev'),
                    ('Class 9', 'A', 'Friday', 'Period 3', '09:40 AM', '10:20 AM', 'Physics Laboratory', 'Rajesh Gowda'),
                    ('Class 9', 'A', 'Friday', 'Period 4', '10:20 AM', '11:00 AM', 'Social Science Study', 'Kiran Kumar'),
                    ('Class 9', 'A', 'Friday', 'Period 5', '11:00 AM', '11:40 AM', 'Chemistry Practical', 'Meera Nair'),
                    ('Class 9', 'A', 'Friday', 'Period 6', '11:40 AM', '12:20 PM', 'Weekly Mock Test', 'Rajesh Gowda')
                `);

                // Saturday for Class 9
                await pool.query(`
                    INSERT INTO timetables (class_name, section, day_of_week, period_name, start_time, end_time, subject_name, teacher_name)
                    VALUES 
                    ('Class 9', 'A', 'Saturday', 'Assembly', '09:00 AM', '10:00 AM', 'Special Guidance Forum', 'Principal')
                `);

                console.log('PostgreSQL default school timetables seeded.');
            }

            // Seed academic_results if empty
            const academicResultsCheck = await pool.query('SELECT * FROM academic_results LIMIT 1');
            if (academicResultsCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO academic_results (
                        academic_year, class_name, section, total_students, students_present, students_absent, 
                        students_passed, students_failed, pass_percentage, distinction_count, first_class_count, 
                        second_class_count, grade_A_count, grade_B_count, grade_C_count, grade_D_count, grade_F_count, 
                        topper_name, topper_marks, average_marks, remarks
                    )
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21),
                    ($22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42),
                    ($43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63)
                `, [
                    '2025-26', 'Class 1', 'A', 40, 38, 2, 36, 4, 90.00, 12, 15, 9, 12, 15, 9, 0, 4, 'Advait Sharma', 98.20, 78.50, 'Excellent mathematical computation. High participation in moral classes.',
                    '2025-26', 'Class 5', 'A', 35, 35, 0, 34, 1, 97.14, 15, 12, 7, 15, 12, 7, 0, 1, 'Priyanshu Sen', 99.00, 84.10, 'Scientific experimentation and environmental studies projects are highly graded.',
                    '2025-26', 'Class 9', 'A', 45, 45, 0, 42, 3, 93.33, 10, 22, 10, 10, 22, 10, 0, 3, 'Deepisree R.', 96.50, 76.20, 'ICT programming performance is exemplary. Science labs need support.'
                ]);
                console.log('PostgreSQL default academic results seeded.');
            }

            // Seed school_timings if empty
            const schoolTimingsCheck = await pool.query('SELECT * FROM school_timings LIMIT 1');
            if (schoolTimingsCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO school_timings (period_name, start_time, end_time, day_type, status)
                    VALUES 
                    ($1, $2, $3, $4, $5),
                    ($6, $7, $8, $9, $10),
                    ($11, $12, $13, $14, $15),
                    ($16, $17, $18, $19, $20),
                    ($21, $22, $23, $24, $25),
                    ($26, $27, $28, $29, $30),
                    ($31, $32, $33, $34, $35),
                    ($36, $37, $38, $39, $40),
                    ($41, $42, $43, $44, $45),
                    ($46, $47, $48, $49, $50)
                `, [
                    'Assembly', '08:30 AM', '08:45 AM', 'Regular', 'Active',
                    'Period 1', '08:45 AM', '09:30 AM', 'Regular', 'Active',
                    'Period 2', '09:30 AM', '10:15 AM', 'Regular', 'Active',
                    'Period 3', '10:15 AM', '11:00 AM', 'Regular', 'Active',
                    'Period 4', '11:00 AM', '11:45 AM', 'Regular', 'Active',
                    'Lunch Break', '11:45 AM', '12:30 PM', 'Regular', 'Active',
                    'Period 5', '12:30 PM', '01:15 PM', 'Regular', 'Active',
                    'Period 6', '01:15 PM', '02:00 PM', 'Regular', 'Active',
                    'Period 7', '02:00 PM', '02:45 PM', 'Regular', 'Active',
                    'Period 8', '02:45 PM', '03:30 PM', 'Regular', 'Active'
                ]);
                console.log('PostgreSQL default school timings seeded.');
            }

            // Seed security settings if empty
            const secSettingsCheck = await pool.query('SELECT * FROM security_settings LIMIT 1');
            if (secSettingsCheck.rows.length === 0) {
                const defaultHash = '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW'; // 'admin123'
                await pool.query(
                    'INSERT INTO security_settings (security_password_hash, updated_by) VALUES ($1, $2)',
                    [defaultHash, 'System']
                );
                console.log('PostgreSQL default security settings seeded.');
            }
        } catch (err) {
            console.error('PostgreSQL Connection/Migration Error. Switching to local JSON fallback db. Reason:', err.message);
            pool = null; // Mark pool inactive so query router falls back automatically
            initLocalDb();
        }
    } else {
        console.log('Using persistent Local JSON DB adapter (No DATABASE_URL found for preview stability).');
        initLocalDb();
    }
};

// Generic adapter execution block to switch between PostgreSQL and persistent local JSON database
const dbQuery = async (text, params = []) => {
    let usePG = !!(isProductionPG && pool);
    if (usePG) {
        try {
            const res = await pool.query(text, params);
            return res;
        } catch (error) {
            const isConnectionError = !error.code || 
                                     error.code.startsWith('08') || 
                                     error.code === 'ECONNREFUSED' || 
                                     error.message.includes('connect') ||
                                     error.message.includes('connection') ||
                                     error.message.includes('timeout') ||
                                     error.message.includes('terminating');
            
            if (isConnectionError) {
                console.warn(`[DATABASE_FALLBACK] PostgreSQL connection failed: ${text}. Falling back permanently to internal JSON adapter. Reason:`, error.message);
                pool = null; // Disable future PG connections for maximum reliability
                usePG = false;
            } else {
                console.error(`[DATABASE_ERROR] PostgreSQL query execution failed: ${text}. Error:`, error.message);
                throw error;
            }
        }
    }
    if (!usePG) {
        // Simple in-memory fallback JSON database parsing queries
        const dbState = getLocalDb();
        const trimmedText = text.trim().toLowerCase();

        // General query interceptor for new tables
        const getTableFromQuery = (ql, keywords) => {
            const normalized = ql.replace(/\s+/g, ' ');
            for (const kw of keywords) {
                if (normalized.includes(`from ${kw}`) || normalized.includes(`into ${kw}`) || normalized.includes(`update ${kw}`) || normalized.includes(`delete from ${kw}`)) {
                    return kw;
                }
            }
            return null;
        };

        const targetTable = getTableFromQuery(trimmedText, ['classrooms', 'subjects', 'attendance', 'exams', 'results', 'campus_settings', 'timetables', 'academic_results', 'school_timings', 'attendance_summary', 'student_attendance', 'security_settings', 'settings', 'staff', 'assignments', 'assignment_submissions', 'substitutions']);
        if (targetTable) {
            if (trimmedText.startsWith('select')) {
                if (targetTable === 'campus_settings' && dbState.campus_settings.length === 0) {
                    const defaultSettings = {
                        id: 1,
                        school_name: 'Majestic Primary & High School',
                        school_motto: 'Shaping Minds for a Better Tomorrow',
                        academic_year: '2026/27',
                        support_email: 'support@majesticschool.edu',
                        support_phone: '+91 7892053861',
                        campus_address: 'Majestic Campus, Bangalore, India',
                        website_url: 'https://majesticschool.edu',
                        logo_url: 'assets/logo.png',
                        theme_settings: 'light',
                        created_at: new Date().toISOString()
                    };
                    dbState.campus_settings.push(defaultSettings);
                    saveLocalDb(dbState);
                }

                if (targetTable === 'security_settings' && (!dbState.security_settings || dbState.security_settings.length === 0)) {
                    if (!dbState.security_settings) dbState.security_settings = [];
                    const defaultSec = {
                        id: 1,
                        security_password_hash: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // 'admin123'
                        updated_by: 'System',
                        updated_at: new Date().toISOString()
                    };
                    dbState.security_settings.push(defaultSec);
                    saveLocalDb(dbState);
                }

                if (trimmedText.includes('where id =') || trimmedText.includes('where id=')) {
                    let id = null;
                    const match = trimmedText.match(/where id\s*=\s*(\d+|\$\d+)/);
                    if (match) {
                        const val = match[1];
                        if (val.startsWith('$')) {
                            const paramIdx = parseInt(val.slice(1), 10) - 1;
                            id = params ? params[paramIdx] : null;
                        } else {
                            id = parseInt(val, 10);
                        }
                    } else if (params && params.length > 0) {
                        id = params[0];
                    }
                    const row = (id !== null && !isNaN(id)) ? dbState[targetTable].find(r => r.id === parseInt(id, 10)) : null;
                    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
                }
                const rows = dbState[targetTable];
                return { rows, rowCount: rows.length };
            }

            if (trimmedText.startsWith('insert into')) {
                let newRow = {};
                if (targetTable === 'classrooms') {
                    newRow = {
                        id: dbState.classrooms.length + 1,
                        class_name: params[0],
                        section: params[1],
                        class_teacher: params[2],
                        room_number: params[3],
                        capacity: params[4] ? parseInt(params[4]) : 40,
                        academic_year: params[5] || '2026-27',
                        status: params[6] || 'Active',
                        advisor_teacher_id: params[7] ? parseInt(params[7]) : null,
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'timetables') {
                    newRow = {
                        id: dbState.timetables.length + 1,
                        class_name: params[0],
                        section: params[1] || 'A',
                        day_of_week: params[2],
                        period_name: params[3],
                        start_time: params[4],
                        end_time: params[5],
                        subject_name: params[6] || null,
                        teacher_name: params[7] || null,
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'subjects') {
                    newRow = {
                        id: dbState.subjects.length + 1,
                        subject_name: params[0],
                        subject_code: params[1],
                        class_name: params[2],
                        teacher_assigned: params[3],
                        weekly_hours: params[4] ? parseInt(params[4]) : 4,
                        description: params[5],
                        status: params[6] || 'Active',
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'attendance') {
                    newRow = {
                        id: dbState.attendance.length + 1,
                        student_name: params[0],
                        class_name: params[1],
                        section: params[2],
                        attendance_date: params[3],
                        status: params[4] || 'Present',
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'exams') {
                    newRow = {
                        id: dbState.exams.length + 1,
                        exam_name: params[0],
                        class_name: params[1],
                        subject_name: params[2],
                        exam_date: params[3],
                        start_time: params[4],
                        end_time: params[5],
                        max_marks: params[6] ? parseInt(params[6]) : 100,
                        status: params[7] || 'Active',
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'results') {
                    newRow = {
                        id: dbState.results.length + 1,
                        student_name: params[0],
                        class_name: params[1],
                        subject_name: params[2],
                        marks_obtained: params[3] ? parseInt(params[3]) : 0,
                        max_marks: params[4] ? parseInt(params[4]) : 100,
                        percentage: params[5] ? parseFloat(params[5]) : 0,
                        grade: params[6],
                        remarks: params[7],
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'campus_settings') {
                    newRow = {
                        id: dbState.campus_settings.length + 1,
                        school_name: params[0],
                        school_motto: params[1],
                        academic_year: params[2] || '2026/27',
                        support_email: params[3],
                        support_phone: params[4],
                        campus_address: params[5],
                        website_url: params[6],
                        logo_url: params[7],
                        theme_settings: params[8] || 'light',
                        created_at: new Date().toISOString()
                    };
                } else if (targetTable === 'academic_results') {
                    newRow = {
                        id: dbState.academic_results.length + 1,
                        academic_year: params[0],
                        class_name: params[1],
                        section: params[2] || 'A',
                        total_students: params[3] ? parseInt(params[3]) : 0,
                        students_present: params[4] ? parseInt(params[4]) : 0,
                        students_absent: params[5] ? parseInt(params[5]) : 0,
                        students_passed: params[6] ? parseInt(params[6]) : 0,
                        students_failed: params[7] ? parseInt(params[7]) : 0,
                        pass_percentage: params[8] ? parseFloat(params[8]) : 0,
                        distinction_count: params[9] ? parseInt(params[9]) : 0,
                        first_class_count: params[10] ? parseInt(params[10]) : 0,
                        second_class_count: params[11] ? parseInt(params[11]) : 0,
                        grade_A_count: params[12] ? parseInt(params[12]) : 0,
                        grade_B_count: params[13] ? parseInt(params[13]) : 0,
                        grade_C_count: params[14] ? parseInt(params[14]) : 0,
                        grade_D_count: params[15] ? parseInt(params[15]) : 0,
                        grade_F_count: params[16] ? parseInt(params[16]) : 0,
                        topper_name: params[17],
                        topper_marks: params[18] ? parseFloat(params[18]) : 0,
                        average_marks: params[19] ? parseFloat(params[19]) : 0,
                        remarks: params[20],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                } else if (targetTable === 'school_timings') {
                    newRow = {
                        id: dbState.school_timings.length + 1,
                        period_name: params[0],
                        start_time: params[1],
                        end_time: params[2],
                        day_type: params[3] || 'Regular',
                        status: params[4] || 'Active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                } else if (targetTable === 'attendance_summary') {
                    newRow = {
                        id: dbState.attendance_summary.length + 1,
                        attendance_date: params[0],
                        academic_year: params[1],
                        class_name: params[2],
                        section: params[3],
                        total_students: params[4] ? parseInt(params[4]) : 0,
                        present_students: params[5] ? parseInt(params[5]) : 0,
                        absent_students: params[6] ? parseInt(params[6]) : 0,
                        attendance_percentage: params[7] ? parseFloat(params[7]) : 0.0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                } else if (targetTable === 'student_attendance') {
                    newRow = {
                        id: dbState.student_attendance.length + 1,
                        student_id: params[0],
                        attendance_date: params[1],
                        status: params[2] || 'Present',
                        remarks: params[3] || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                } else if (targetTable === 'security_settings') {
                    newRow = {
                        id: (dbState.security_settings || []).length + 1,
                        security_password_hash: params[0],
                        updated_by: params[1],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                }
                if (!dbState[targetTable]) dbState[targetTable] = [];
                dbState[targetTable].push(newRow);
                saveLocalDb(dbState);
                return { rows: [newRow], rowCount: 1 };
            }

            if (trimmedText.startsWith('update')) {
                if (targetTable === 'campus_settings') {
                    let settingRow = dbState.campus_settings.find(s => s.id === 1);
                    if (!settingRow) {
                        settingRow = { id: 1 };
                        dbState.campus_settings.push(settingRow);
                    }
                    settingRow.school_name = params[0];
                    settingRow.school_motto = params[1];
                    settingRow.academic_year = params[2];
                    settingRow.support_email = params[3];
                    settingRow.support_phone = params[4];
                    settingRow.campus_address = params[5];
                    settingRow.website_url = params[6];
                    settingRow.logo_url = params[7];
                    settingRow.theme_settings = params[8];
                    saveLocalDb(dbState);
                    return { rowCount: 1 };
                }

                if (targetTable === 'security_settings') {
                    let secRow = dbState.security_settings.find(s => s.id === 1);
                    if (!secRow) {
                        secRow = { id: 1 };
                        dbState.security_settings.push(secRow);
                    }
                    secRow.security_password_hash = params[0];
                    secRow.updated_by = params[1] || 'System';
                    secRow.updated_at = new Date().toISOString();
                    saveLocalDb(dbState);
                    return { rowCount: 1 };
                }

                const id = params[params.length - 1];
                const index = dbState[targetTable].findIndex(r => r.id === parseInt(id));
                if (index !== -1) {
                    if (targetTable === 'classrooms') {
                        dbState.classrooms[index].class_name = params[0];
                        dbState.classrooms[index].section = params[1];
                        dbState.classrooms[index].class_teacher = params[2];
                        dbState.classrooms[index].room_number = params[3];
                        dbState.classrooms[index].capacity = params[4];
                        dbState.classrooms[index].academic_year = params[5];
                        dbState.classrooms[index].status = params[6];
                        dbState.classrooms[index].advisor_teacher_id = params[7] ? parseInt(params[7]) : null;
                    } else if (targetTable === 'timetables') {
                        dbState.timetables[index].class_name = params[0];
                        dbState.timetables[index].section = params[1];
                        dbState.timetables[index].day_of_week = params[2];
                        dbState.timetables[index].period_name = params[3];
                        dbState.timetables[index].start_time = params[4];
                        dbState.timetables[index].end_time = params[5];
                        dbState.timetables[index].subject_name = params[6];
                        dbState.timetables[index].teacher_name = params[7];
                    } else if (targetTable === 'subjects') {
                        dbState.subjects[index].subject_name = params[0];
                        dbState.subjects[index].subject_code = params[1];
                        dbState.subjects[index].class_name = params[2];
                        dbState.subjects[index].teacher_assigned = params[3];
                        dbState.subjects[index].weekly_hours = params[4];
                        dbState.subjects[index].description = params[5];
                        dbState.subjects[index].status = params[6];
                    } else if (targetTable === 'attendance') {
                        dbState.attendance[index].student_name = params[0];
                        dbState.attendance[index].class_name = params[1];
                        dbState.attendance[index].section = params[2];
                        dbState.attendance[index].attendance_date = params[3];
                        dbState.attendance[index].status = params[4];
                    } else if (targetTable === 'exams') {
                        dbState.exams[index].exam_name = params[0];
                        dbState.exams[index].class_name = params[1];
                        dbState.exams[index].subject_name = params[2];
                        dbState.exams[index].exam_date = params[3];
                        dbState.exams[index].start_time = params[4];
                        dbState.exams[index].end_time = params[5];
                        dbState.exams[index].max_marks = params[6];
                        dbState.exams[index].status = params[7];
                    } else if (targetTable === 'results') {
                        dbState.results[index].student_name = params[0];
                        dbState.results[index].class_name = params[1];
                        dbState.results[index].subject_name = params[2];
                        dbState.results[index].marks_obtained = params[3];
                        dbState.results[index].max_marks = params[4];
                        dbState.results[index].percentage = params[5];
                        dbState.results[index].grade = params[6];
                        dbState.results[index].remarks = params[7];
                    } else if (targetTable === 'academic_results') {
                        dbState.academic_results[index].academic_year = params[0];
                        dbState.academic_results[index].class_name = params[1];
                        dbState.academic_results[index].section = params[2];
                        dbState.academic_results[index].total_students = params[3] ? parseInt(params[3]) : 0;
                        dbState.academic_results[index].students_present = params[4] ? parseInt(params[4]) : 0;
                        dbState.academic_results[index].students_absent = params[5] ? parseInt(params[5]) : 0;
                        dbState.academic_results[index].students_passed = params[6] ? parseInt(params[6]) : 0;
                        dbState.academic_results[index].students_failed = params[7] ? parseInt(params[7]) : 0;
                        dbState.academic_results[index].pass_percentage = params[8] ? parseFloat(params[8]) : 0;
                        dbState.academic_results[index].distinction_count = params[9] ? parseInt(params[9]) : 0;
                        dbState.academic_results[index].first_class_count = params[10] ? parseInt(params[10]) : 0;
                        dbState.academic_results[index].second_class_count = params[11] ? parseInt(params[11]) : 0;
                        dbState.academic_results[index].grade_A_count = params[12] ? parseInt(params[12]) : 0;
                        dbState.academic_results[index].grade_B_count = params[13] ? parseInt(params[13]) : 0;
                        dbState.academic_results[index].grade_C_count = params[14] ? parseInt(params[14]) : 0;
                        dbState.academic_results[index].grade_D_count = params[15] ? parseInt(params[15]) : 0;
                        dbState.academic_results[index].grade_F_count = params[16] ? parseInt(params[16]) : 0;
                        dbState.academic_results[index].topper_name = params[17];
                        dbState.academic_results[index].topper_marks = params[18] ? parseFloat(params[18]) : 0;
                        dbState.academic_results[index].average_marks = params[19] ? parseFloat(params[19]) : 0;
                        dbState.academic_results[index].remarks = params[20];
                        dbState.academic_results[index].updated_at = new Date().toISOString();
                    } else if (targetTable === 'school_timings') {
                        dbState.school_timings[index].period_name = params[0];
                        dbState.school_timings[index].start_time = params[1];
                        dbState.school_timings[index].end_time = params[2];
                        dbState.school_timings[index].day_type = params[3];
                        dbState.school_timings[index].status = params[4];
                        dbState.school_timings[index].updated_at = new Date().toISOString();
                    } else if (targetTable === 'attendance_summary') {
                        dbState.attendance_summary[index].attendance_date = params[0];
                        dbState.attendance_summary[index].academic_year = params[1];
                        dbState.attendance_summary[index].class_name = params[2];
                        dbState.attendance_summary[index].section = params[3];
                        dbState.attendance_summary[index].total_students = params[4] ? parseInt(params[4]) : 0;
                        dbState.attendance_summary[index].present_students = params[5] ? parseInt(params[5]) : 0;
                        dbState.attendance_summary[index].absent_students = params[6] ? parseInt(params[6]) : 0;
                        dbState.attendance_summary[index].attendance_percentage = params[7] ? parseFloat(params[7]) : 0.0;
                        dbState.attendance_summary[index].updated_at = new Date().toISOString();
                    } else if (targetTable === 'student_attendance') {
                        dbState.student_attendance[index].student_id = params[0];
                        dbState.student_attendance[index].attendance_date = params[1];
                        dbState.student_attendance[index].status = params[2];
                        dbState.student_attendance[index].remarks = params[3];
                        dbState.student_attendance[index].updated_at = new Date().toISOString();
                    } else if (targetTable === 'security_settings') {
                        dbState.security_settings[index].security_password_hash = params[0];
                        dbState.security_settings[index].updated_by = params[1] || 'System';
                        dbState.security_settings[index].updated_at = new Date().toISOString();
                    }
                    saveLocalDb(dbState);
                    return { rowCount: 1 };
                }
                return { rowCount: 0 };
            }

            if (trimmedText.startsWith('delete from')) {
                const id = params[0];
                const originalLength = dbState[targetTable].length;
                dbState[targetTable] = dbState[targetTable].filter(r => r.id !== parseInt(id));
                saveLocalDb(dbState);
                return { rowCount: originalLength - dbState[targetTable].length };
            }
        }

        // Handler: Teachers Management
        if (trimmedText.startsWith('insert into teachers')) {
            const newTch = {
                id: dbState.teachers.length + 1,
                teacher_id: params[0],
                employee_code: params[1],
                full_name: params[2],
                photo: params[3] || null,
                gender: params[4] || null,
                dob: params[5] || null,
                qualification: params[6] || null,
                experience: params[7] || null,
                subject: params[8] || null,
                assigned_class: params[9] || null,
                mobile_number: params[10] || null,
                email: params[11],
                address: params[12] || null,
                joining_date: params[13] || null,
                salary: params[14] || null,
                aadhaar_number: params[15] || null,
                status: params[16] || 'Active',
                username: params[17] || null,
                password: params[18] || null,
                documents: params[19] || '[]',
                created_at: new Date().toISOString()
            };
            dbState.teachers.push(newTch);
            saveLocalDb(dbState);
            return { rows: [newTch], rowCount: 1 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from teachers') && !trimmedText.includes('where')) {
            return { rows: dbState.teachers, rowCount: dbState.teachers.length };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from teachers where id =')) {
            const id = params[0];
            const tch = dbState.teachers.find(t => t.id === parseInt(id));
            return { rows: tch ? [tch] : [], rowCount: tch ? 1 : 0 };
        }

        if (trimmedText.startsWith('update teachers set assigned_class')) {
            const [assigned_class, id] = params;
            const index = dbState.teachers.findIndex(t => t.id === parseInt(id));
            if (index !== -1) {
                dbState.teachers[index].assigned_class = assigned_class;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update teachers set subject')) {
            const [subject, id] = params;
            const index = dbState.teachers.findIndex(t => t.id === parseInt(id));
            if (index !== -1) {
                dbState.teachers[index].subject = subject;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update teachers set status')) {
            const [status, id] = params;
            const index = dbState.teachers.findIndex(t => t.id === parseInt(id));
            if (index !== -1) {
                dbState.teachers[index].status = status;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update teachers')) {
            const [
                teacher_id, employee_code, full_name, photo, gender, dob,
                qualification, experience, subject, assigned_class,
                mobile_number, email, address, joining_date, salary,
                aadhaar_number, status, username, password, documents, id
            ] = params;

            const index = dbState.teachers.findIndex(t => t.id === parseInt(id));
            if (index !== -1) {
                dbState.teachers[index].teacher_id = teacher_id;
                dbState.teachers[index].employee_code = employee_code;
                dbState.teachers[index].full_name = full_name;
                dbState.teachers[index].photo = photo;
                dbState.teachers[index].gender = gender;
                dbState.teachers[index].dob = dob;
                dbState.teachers[index].qualification = qualification;
                dbState.teachers[index].experience = experience;
                dbState.teachers[index].subject = subject;
                dbState.teachers[index].assigned_class = assigned_class;
                dbState.teachers[index].mobile_number = mobile_number;
                dbState.teachers[index].email = email;
                dbState.teachers[index].address = address;
                dbState.teachers[index].joining_date = joining_date;
                dbState.teachers[index].salary = salary;
                dbState.teachers[index].aadhaar_number = aadhaar_number;
                dbState.teachers[index].status = status;
                dbState.teachers[index].username = username;
                dbState.teachers[index].password = password;
                dbState.teachers[index].documents = documents;

                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from teachers')) {
            const id = params[0];
            const originalLength = dbState.teachers.length;
            dbState.teachers = dbState.teachers.filter(t => t.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.teachers.length };
        }

        // --- STATS AND AGGREGATES FALLBACK ROUTING (High Priority) ---
        if (trimmedText.includes('from admissions group by status')) {
            const counts = {};
            dbState.admissions.forEach(adm => {
                const status = adm.status || 'Pending';
                counts[status] = (counts[status] || 0) + 1;
            });
            const rows = Object.entries(counts).map(([status, count]) => ({
                status,
                count: count.toString()
            }));
            return { rows, rowCount: rows.length };
        }

        if (trimmedText.includes('select count(*) as count from students')) {
            return { rows: [{ count: dbState.students.length.toString() }], rowCount: 1 };
        }

        if (trimmedText.includes('select count(*) as count from messages')) {
            return { rows: [{ count: dbState.messages.length.toString() }], rowCount: 1 };
        }

        if (trimmedText.includes('select count(*) as count from users')) {
            return { rows: [{ count: dbState.users.length.toString() }], rowCount: 1 };
        }

        // Handler: User Signup or insert
        if (trimmedText.startsWith('insert into users')) {
            const newUser = {
                id: dbState.users.length + 1,
                name: params[0],
                email: params[1],
                mobile_number: params[2] || null,
                password: params[3],
                role: params[4] || 'Student',
                status: params[5] || (params[4] === 'Super Admin' || params[4] === 'Staff' ? 'Active' : 'Pending'),
                created_at: new Date().toISOString()
            };
            if (dbState.users.some(u => u.email === newUser.email)) {
                throw new Error('Email already exists');
            }
            dbState.users.push(newUser);
            saveLocalDb(dbState);
            return { rows: [newUser], rowCount: 1, lastID: newUser.id };
        }

        // Handler: User fetch
        if (trimmedText.startsWith('select') && trimmedText.includes('from users where email =')) {
            const email = params[0];
            const user = dbState.users.find(u => u.email === email);
            return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from users where id =')) {
            const id = params[0];
            const user = dbState.users.find(u => u.id === parseInt(id));
            return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from users') && !trimmedText.includes('where')) {
            return { rows: dbState.users, rowCount: dbState.users.length };
        }

        if (trimmedText.startsWith('update users set password')) {
            const [password, queryVal] = params;
            let index = -1;
            if (trimmedText.includes('where id =') || trimmedText.includes('where id=')) {
                index = dbState.users.findIndex(u => u.id === parseInt(queryVal));
            } else {
                index = dbState.users.findIndex(u => u.email === queryVal);
            }
            if (index !== -1) {
                dbState.users[index].password = password;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update users set reset_token')) {
            const [token, expiry, email] = params;
            const index = dbState.users.findIndex(u => u.email === email);
            if (index !== -1) {
                dbState.users[index].reset_token = token;
                dbState.users[index].reset_expiry = expiry;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update users set password')) {
            const [password, email] = params;
            const index = dbState.users.findIndex(u => u.email === email);
            if (index !== -1) {
                dbState.users[index].password = password;
                dbState.users[index].reset_token = null;
                dbState.users[index].reset_expiry = null;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update users')) {
            // Check specifically for setting user status (e.g., PUT approve/reject requests)
            if (trimmedText.includes('set status =') || trimmedText.includes('set status=')) {
                const [status, id] = params;
                const index = dbState.users.findIndex(u => u.id === parseInt(id));
                if (index !== -1) {
                    dbState.users[index].status = status;
                    saveLocalDb(dbState);
                    return { rowCount: 1 };
                }
                return { rowCount: 0 };
            }
            // Update admin profile or users: name=?, email=?, mobile_number=?, role=? WHERE id=?
            const [name, email, mobile_number, role, id] = params;
            const index = dbState.users.findIndex(u => u.id === parseInt(id));
            if (index !== -1) {
                dbState.users[index].name = name;
                dbState.users[index].email = email;
                dbState.users[index].mobile_number = mobile_number;
                dbState.users[index].role = role;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from users')) {
            const id = params[0];
            const originalLength = dbState.users.length;
            dbState.users = dbState.users.filter(u => u.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.users.length };
        }

        // Handler: Admissions CRUDs
        if (trimmedText.startsWith('insert into admissions')) {
            const newAdm = {
                id: dbState.admissions.length + 1,
                student_name: params[0],
                parent_name: params[1],
                mobile: params[2],
                email: params[3],
                class_applied: params[4],
                address: params[5],
                previous_school: params[6],
                remarks: params[7],
                status: 'Pending',
                student_photo: params[8] || null,
                aadhaar: params[9] || null,
                transfer_certificate: params[10] || null,
                marks_card: params[11] || null,
                gender: params[12] || 'Not Specified',
                assigned_section: params[13] || 'Mixed',
                created_at: new Date().toISOString()
            };
            dbState.admissions.push(newAdm);
            saveLocalDb(dbState);
            return { rows: [newAdm], rowCount: 1 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from admissions') && !trimmedText.includes('where')) {
            return { rows: dbState.admissions, rowCount: dbState.admissions.length };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from admissions where id =')) {
            const id = params[0];
            const adm = dbState.admissions.find(a => a.id === parseInt(id));
            return { rows: adm ? [adm] : [], rowCount: adm ? 1 : 0 };
        }

        if (trimmedText.startsWith('update admissions set status')) {
            const [status, id] = params;
            const index = dbState.admissions.findIndex(a => a.id === parseInt(id));
            if (index !== -1) {
                dbState.admissions[index].status = status;
                
                // If admission is approved, automatically create a student account and user (if not exists)
                if (status === 'Approved') {
                    const adm = dbState.admissions[index];
                    // Create user if not existing
                    let existingUser = dbState.users.find(u => u.email === adm.email);
                    let userId = existingUser ? existingUser.id : null;
                    if (!existingUser) {
                        userId = dbState.users.length + 1;
                        dbState.users.push({
                            id: userId,
                            name: adm.student_name,
                            email: adm.email,
                            mobile_number: adm.mobile,
                            password: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // Default password 'student123'
                            role: 'Student',
                            status: 'Active',
                            created_at: new Date().toISOString()
                        });
                    }

                    // Create student record with full fields
                    let existingStud = dbState.students.find(s => s.admission_id === adm.id);
                    let studentId = existingStud ? existingStud.student_id : null;
                    if (!existingStud) {
                        studentId = `STU${Math.floor(1000 + Math.random() * 9000)}`;
                        const admNum = `ADM${Math.floor(1000 + Math.random() * 9000)}`;
                        const newStud = {
                            id: dbState.students.length + 1,
                            user_id: userId,
                            admission_id: adm.id,
                            academic_year: '2026-27',
                            class: adm.class_applied,
                            section: adm.assigned_section || 'Mixed',
                            status: 'Active',
                            parent_name: adm.parent_name,
                            student_id: studentId,
                            admission_number: admNum,
                            full_name: adm.student_name,
                            gender: adm.gender || 'Not Specified',
                            dob: 'Not Specified',
                            phone: adm.mobile,
                            email: adm.email,
                            address: adm.address,
                            created_at: new Date().toISOString()
                        };
                        dbState.students.push(newStud);
                    }

                    // Automatically create associated Parent record
                    let existingPar = dbState.parents.find(p => p.email === adm.email);
                    if (!existingPar) {
                        const parentId = `PAR${Math.floor(1000 + Math.random() * 9000)}`;
                        dbState.parents.push({
                            id: dbState.parents.length + 1,
                            parent_id: parentId,
                            father_name: adm.parent_name,
                            mother_name: 'Not Specified',
                            phone: adm.mobile,
                            email: adm.email,
                            address: adm.address,
                            linked_students: JSON.stringify([studentId]),
                            created_at: new Date().toISOString()
                        });
                    } else {
                        let currentLinked = [];
                        try {
                            currentLinked = JSON.parse(existingPar.linked_students);
                            if (!Array.isArray(currentLinked)) currentLinked = [existingPar.linked_students];
                        } catch (e) {
                            currentLinked = existingPar.linked_students ? [existingPar.linked_students] : [];
                        }
                        if (!currentLinked.includes(studentId)) {
                            currentLinked.push(studentId);
                            const parIdx = dbState.parents.findIndex(p => p.id === existingPar.id);
                            if (parIdx !== -1) {
                                dbState.parents[parIdx].linked_students = JSON.stringify(currentLinked);
                            }
                        }
                    }
                }
                
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from admissions')) {
            const id = params[0];
            const originalLength = dbState.admissions.length;
            dbState.admissions = dbState.admissions.filter(a => a.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.admissions.length };
        }

        // Handler: Contact Messages
        if (trimmedText.startsWith('insert into messages')) {
            let newMsg = {};
            if (params.length === 5) {
                newMsg = {
                    id: dbState.messages.length + 1,
                    name: params[0],
                    email: params[1],
                    phone: params[2],
                    subject: params[3],
                    message: params[4],
                    is_read: false,
                    status: 'Open',
                    reply_message: null,
                    created_at: new Date().toISOString()
                };
            } else {
                newMsg = {
                    id: dbState.messages.length + 1,
                    name: params[0],
                    email: params[1],
                    phone: null,
                    subject: params[2],
                    message: params[3],
                    is_read: false,
                    status: 'Open',
                    reply_message: null,
                    created_at: new Date().toISOString()
                };
            }
            dbState.messages.push(newMsg);
            saveLocalDb(dbState);
            return { rows: [newMsg], rowCount: 1 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from messages') && !trimmedText.includes('where')) {
            return { rows: dbState.messages, rowCount: dbState.messages.length };
        }

        if (trimmedText.startsWith('update messages set is_read')) {
            const id = params.length === 2 ? params[1] : params[0];
            const isRead = params.length === 2 ? params[0] : true;
            const index = dbState.messages.findIndex(m => m.id === parseInt(id));
            if (index !== -1) {
                dbState.messages[index].is_read = isRead;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('update messages set reply_message')) {
            const [replyMessage, id] = params;
            const index = dbState.messages.findIndex(m => m.id === parseInt(id));
            if (index !== -1) {
                dbState.messages[index].reply_message = replyMessage;
                dbState.messages[index].is_read = true;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from messages')) {
            const id = params[0];
            const originalLength = dbState.messages.length;
            dbState.messages = dbState.messages.filter(m => m.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.messages.length };
        }

        // Handler: Students Management
        if (trimmedText.startsWith('insert into students')) {
            let newStud = {};
            if (params.length === 10) {
                // From admissions route:
                // [sUserId, id, targetAdm.class_applied, targetAdm.parent_name, sIdStr, aNumStr, targetAdm.student_name, targetAdm.mobile, targetAdm.email, targetAdm.address]
                newStud = {
                    id: dbState.students.length + 1,
                    user_id: params[0] || null,
                    admission_id: params[1] || null,
                    academic_year: '2026-27',
                    class: params[2] || null,
                    parent_name: params[3] || null,
                    status: 'Active',
                    student_id: params[4] || null,
                    admission_number: params[5] || null,
                    full_name: params[6] || null,
                    section: 'A',
                    gender: 'Not Specified',
                    dob: 'Not Specified',
                    phone: params[7] || null,
                    email: params[8] || null,
                    address: params[9] || null,
                    created_at: new Date().toISOString()
                };
            } else {
                // From standard student form POST (15 or 17 parameters):
                // [user_id, admission_id, academic_year, class, status, parent_name, student_id, admission_number, full_name, section, gender, dob, phone, email, address, roll_number, remarks]
                newStud = {
                    id: dbState.students.length + 1,
                    user_id: params[0] || null,
                    admission_id: params[1] || null,
                    academic_year: params[2] || '2026-27',
                    class: params[3] || null,
                    status: params[4] || 'Active',
                    parent_name: params[5] || null,
                    student_id: params[6] || null,
                    admission_number: params[7] || null,
                    full_name: params[8] || null,
                    section: params[9] || null,
                    gender: params[10] || null,
                    dob: params[11] || null,
                    phone: params[12] || null,
                    email: params[13] || null,
                    address: params[14] || null,
                    roll_number: params[15] || null,
                    remarks: params[16] || null,
                    created_at: new Date().toISOString()
                };
            }
            dbState.students.push(newStud);
            saveLocalDb(dbState);
            return { rows: [newStud], rowCount: 1 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from students where id =')) {
            const id = params[0] || (trimmedText.match(/id\s*=\s*\$?(\d+)/) || [])[1];
            const found = dbState.students.find(s => s.id === parseInt(id));
            return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from students') && !trimmedText.includes('where')) {
            // Join client-side representation
            const list = dbState.students.map(s => {
                const user = dbState.users.find(u => u.id === s.user_id) || {};
                return {
                    ...s,
                    student_name: s.full_name || user.name || 'N/A',
                    email: s.email || user.email || 'N/A',
                    mobile_number: s.phone || user.mobile_number || 'N/A'
                };
            });
            return { rows: list, rowCount: list.length };
        }

        if (trimmedText.startsWith('update students')) {
            // Handle parameterized student edits across items
            const index = dbState.students.findIndex(s => s.id === parseInt(params[params.length - 1]));
            if (index !== -1) {
                dbState.students[index].user_id = params[0];
                dbState.students[index].admission_id = params[1];
                dbState.students[index].academic_year = params[2];
                dbState.students[index].class = params[3];
                dbState.students[index].status = params[4];
                dbState.students[index].parent_name = params[5];
                dbState.students[index].student_id = params[6];
                dbState.students[index].admission_number = params[7];
                dbState.students[index].full_name = params[8];
                dbState.students[index].section = params[9];
                dbState.students[index].gender = params[10];
                dbState.students[index].dob = params[11];
                dbState.students[index].phone = params[12];
                dbState.students[index].email = params[13];
                dbState.students[index].address = params[14];
                if (params.length >= 18) {
                    dbState.students[index].roll_number = params[15];
                    dbState.students[index].remarks = params[16];
                }
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from students')) {
            const id = params[0];
            const originalLength = dbState.students.length;
            dbState.students = dbState.students.filter(s => s.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.students.length };
        }

        // Handler: Parents Management
        if (trimmedText.startsWith('insert into parents')) {
            const newPar = {
                id: dbState.parents.length + 1,
                parent_id: params[0],
                father_name: params[1],
                mother_name: params[2] || null,
                phone: params[3] || null,
                email: params[4] || null,
                address: params[5] || null,
                linked_students: params[6] || null,
                created_at: new Date().toISOString()
            };
            dbState.parents.push(newPar);
            saveLocalDb(dbState);
            return { rows: [newPar], rowCount: 1 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from parents where id =')) {
            const id = params[0];
            const found = dbState.parents.find(p => p.id === parseInt(id));
            return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
        }

        if (trimmedText.startsWith('select') && trimmedText.includes('from parents') && !trimmedText.includes('where')) {
            return { rows: dbState.parents, rowCount: dbState.parents.length };
        }

        if (trimmedText.startsWith('update parents')) {
            const [parent_id, father_name, mother_name, phone, email, address, linked_students, id] = params;
            const index = dbState.parents.findIndex(p => p.id === parseInt(id));
            if (index !== -1) {
                dbState.parents[index].parent_id = parent_id;
                dbState.parents[index].father_name = father_name;
                dbState.parents[index].mother_name = mother_name;
                dbState.parents[index].phone = phone;
                dbState.parents[index].email = email;
                dbState.parents[index].address = address;
                dbState.parents[index].linked_students = linked_students;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from parents')) {
            const id = params[0];
            const originalLength = dbState.parents.length;
            dbState.parents = dbState.parents.filter(p => p.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.parents.length };
        }

        // Handler: Announcements Content Management
        if (trimmedText.startsWith('insert into announcements')) {
            const newAnn = {
                id: dbState.announcements.length + 1,
                title: params[0],
                description: params[1],
                category: params[2],
                created_at: new Date().toISOString()
            };
            dbState.announcements.push(newAnn);
            saveLocalDb(dbState);
            return { rows: [newAnn], rowCount: 1 };
        }

        if (trimmedText.includes('from announcements') && !trimmedText.includes('where')) {
            return { rows: dbState.announcements, rowCount: dbState.announcements.length };
        }

        if (trimmedText.startsWith('update announcements')) {
            const [title, desc, category, id] = params;
            const index = dbState.announcements.findIndex(a => a.id === parseInt(id));
            if (index !== -1) {
                dbState.announcements[index].title = title;
                dbState.announcements[index].description = desc;
                dbState.announcements[index].category = category;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from announcements')) {
            const id = params[0];
            const originalLength = dbState.announcements.length;
            dbState.announcements = dbState.announcements.filter(a => a.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.announcements.length };
        }

        // Handler: Events Content Management
        if (trimmedText.startsWith('insert into events')) {
            const newEvent = {
                id: dbState.events.length + 1,
                title: params[0],
                date: params[1],
                location: params[2],
                description: params[3],
                created_at: new Date().toISOString()
            };
            dbState.events.push(newEvent);
            saveLocalDb(dbState);
            return { rows: [newEvent], rowCount: 1 };
        }

        if (trimmedText.includes('from events') && !trimmedText.includes('where')) {
            return { rows: dbState.events, rowCount: dbState.events.length };
        }

        if (trimmedText.startsWith('update events')) {
            const [title, date, location, desc, id] = params;
            const index = dbState.events.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                dbState.events[index].title = title;
                dbState.events[index].date = date;
                dbState.events[index].location = location;
                dbState.events[index].description = desc;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        if (trimmedText.startsWith('delete from events')) {
            const id = params[0];
            const originalLength = dbState.events.length;
            dbState.events = dbState.events.filter(e => e.id !== parseInt(id));
            saveLocalDb(dbState);
            return { rowCount: originalLength - dbState.events.length };
        }

        // Handler: Notifications
        if (trimmedText.startsWith('insert into notifications')) {
            const newNotif = {
                id: dbState.notifications.length + 1,
                type: params[0],
                message: params[1],
                is_read: false,
                created_at: new Date().toISOString()
            };
            dbState.notifications.push(newNotif);
            saveLocalDb(dbState);
            return { rows: [newNotif], rowCount: 1 };
        }

        if (trimmedText.includes('from notifications') && !trimmedText.includes('where')) {
            return { rows: dbState.notifications, rowCount: dbState.notifications.length };
        }

        if (trimmedText.startsWith('update notifications set is_read')) {
            const [isRead, id] = params;
            const index = dbState.notifications.findIndex(n => n.id === parseInt(id));
            if (index !== -1) {
                dbState.notifications[index].is_read = isRead;
                saveLocalDb(dbState);
                return { rowCount: 1 };
            }
            return { rowCount: 0 };
        }

        return { rows: [], rowCount: 0 };
    }
};

module.exports = {
    initializeDatabase,
    query: dbQuery,
    isProductionPG
};
