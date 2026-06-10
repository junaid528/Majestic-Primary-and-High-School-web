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
    if (!fs.existsSync(localDbPath)) {
        const initialSchema = {
            users: [
                // Injected Default Admin
                {
                    id: 1,
                    name: 'Super Admin',
                    email: 'majestichps@gmail.com',
                    mobileNumber: '7892053860',
                    password: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // bcrypt hash for 'admin123'
                    role: 'Super Admin',
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
            ]
        };
        fs.writeFileSync(localDbPath, JSON.stringify(initialSchema, null, 2));
    }
};

const getLocalDb = () => {
    initLocalDb();
    const data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    
    // Ensure all schema arrays exist to avoid Undefined/TypeError crashes
    const collections = ['users', 'students', 'parents', 'admissions', 'messages', 'announcements', 'events', 'uploads', 'admin_logs', 'notifications', 'teachers'];
    let modified = false;
    collections.forEach(col => {
        if (!data[col]) {
            data[col] = [];
            modified = true;
        }
    });
    
    if (!data.teachers || data.teachers.length === 0) {
        data.teachers = [
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
        ];
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
        subject VARCHAR(150),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
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
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS dob VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(100);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;"
            ];
            for (const q of addColQueries) {
                await pool.query(q).catch(e => console.log('Migration column addition note:', e.message));
            }

            // Insert default Super Admin if not exists
            const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['majestichps@gmail.com']);
            if (adminCheck.rows.length === 0) {
                const adminPass = '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW'; // 'admin123'
                await pool.query(
                    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                    ['Super Admin', 'majestichps@gmail.com', adminPass, 'Super Admin']
                );
                console.log('PostgreSQL Super Admin default profile seeded.');
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
    if (isProductionPG && pool) {
        try {
            const res = await pool.query(text, params);
            return res;
        } catch (error) {
            console.error(`PostgreSQL query failed: ${text}. Trying to handle...`, error.message);
            throw error;
        }
    } else {
        // Simple in-memory fallback JSON database parsing queries
        const dbState = getLocalDb();
        const trimmedText = text.trim().toLowerCase();

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

        if (trimmedText.includes('from teachers') && !trimmedText.includes('where')) {
            return { rows: dbState.teachers, rowCount: dbState.teachers.length };
        }

        if (trimmedText.includes('from teachers where id =')) {
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
        if (trimmedText.includes('from users where email =')) {
            const email = params[0];
            const user = dbState.users.find(u => u.email === email);
            return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        if (trimmedText.includes('from users where id =')) {
            const id = params[0];
            const user = dbState.users.find(u => u.id === parseInt(id));
            return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        if (trimmedText.includes('from users') && !trimmedText.includes('where')) {
            return { rows: dbState.users, rowCount: dbState.users.length };
        }

        if (trimmedText.startsWith('update users set password')) {
            const [password, email] = params;
            const index = dbState.users.findIndex(u => u.email === email);
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

        if (trimmedText.startsWith('update users')) {
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
                created_at: new Date().toISOString()
            };
            dbState.admissions.push(newAdm);
            saveLocalDb(dbState);
            return { rows: [newAdm], rowCount: 1 };
        }

        if (trimmedText.includes('from admissions') && !trimmedText.includes('where')) {
            return { rows: dbState.admissions, rowCount: dbState.admissions.length };
        }

        if (trimmedText.includes('from admissions where id =')) {
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
                            password: '$2a$10$P4sUbo1rTevPc4A0SBKKFelenXfW4anGi/MlGopI7.E.xVuXBqWcW', // Default password 'admin123'
                            role: 'Student',
                            created_at: new Date().toISOString()
                        });
                    }
                    // Create student record
                    if (!dbState.students.some(s => s.admission_id === adm.id)) {
                        dbState.students.push({
                            id: dbState.students.length + 1,
                            user_id: userId,
                            admission_id: adm.id,
                            academic_year: '2026-27',
                            class: adm.class_applied,
                            status: 'Active',
                            parent_name: adm.parent_name,
                            created_at: new Date().toISOString()
                        });
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
            const newMsg = {
                id: dbState.messages.length + 1,
                name: params[0],
                email: params[1],
                subject: params[2],
                message: params[3],
                is_read: false,
                reply_message: null,
                created_at: new Date().toISOString()
            };
            dbState.messages.push(newMsg);
            saveLocalDb(dbState);
            return { rows: [newMsg], rowCount: 1 };
        }

        if (trimmedText.includes('from messages') && !trimmedText.includes('where')) {
            return { rows: dbState.messages, rowCount: dbState.messages.length };
        }

        if (trimmedText.startsWith('update messages set is_read')) {
            const [isRead, id] = params;
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
            const newStud = {
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
                created_at: new Date().toISOString()
            };
            dbState.students.push(newStud);
            saveLocalDb(dbState);
            return { rows: [newStud], rowCount: 1 };
        }

        if (trimmedText.includes('from students where id =')) {
            const id = params[0] || (trimmedText.match(/id\s*=\s*\$?(\d+)/) || [])[1];
            const found = dbState.students.find(s => s.id === parseInt(id));
            return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
        }

        if (trimmedText.includes('from students') && !trimmedText.includes('where')) {
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
            // Handle parameterized student edits across all 16 items
            const [
                user_id, admission_id, academic_year, sClass, status, parent_name,
                student_id, admission_number, full_name, section, gender, dob,
                phone, email, address, id
            ] = params;
            const index = dbState.students.findIndex(s => s.id === parseInt(id));
            if (index !== -1) {
                dbState.students[index].user_id = user_id;
                dbState.students[index].admission_id = admission_id;
                dbState.students[index].academic_year = academic_year;
                dbState.students[index].class = sClass;
                dbState.students[index].status = status;
                dbState.students[index].parent_name = parent_name;
                dbState.students[index].student_id = student_id;
                dbState.students[index].admission_number = admission_number;
                dbState.students[index].full_name = full_name;
                dbState.students[index].section = section;
                dbState.students[index].gender = gender;
                dbState.students[index].dob = dob;
                dbState.students[index].phone = phone;
                dbState.students[index].email = email;
                dbState.students[index].address = address;
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

        if (trimmedText.includes('from parents where id =')) {
            const id = params[0];
            const found = dbState.parents.find(p => p.id === parseInt(id));
            return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
        }

        if (trimmedText.includes('from parents') && !trimmedText.includes('where')) {
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
