const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const db = require('../config/db');
const { verifyToken, authorizeRoles, JWT_SECRET } = require('../middleware/auth');
const { admissionsUpload } = require('../middleware/upload');
const emailService = require('../services/email');

// Helper to sanitize database output from PG rows
const getResultRows = (resResult) => {
    return resResult && resResult.rows ? resResult.rows : [];
};

// HELPER: Create Admin Notification Alert
const createNotification = async (type, message) => {
    try {
        await db.query(
            'INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, FALSE)',
            [type, message]
        );
    } catch (e) {
        console.error('Failed to create notification alert context:', e.message);
    }
};

/* ==========================================
   🔑 1. AUTHENTICATION & PORTAL API
   ========================================== */

// 1.1 Student/Parent Registration
const handleRegistration = async (req, res) => {
    const { name, email, password, confirmPassword, studentClass, parentName } = req.body;
    const mobileNumber = req.body.mobileNumber || req.body.phone;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, Email, and Password are required inputs.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match with verification field.' });
    }

    // Passwords check
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password is too weak. Ensure it is at least 6 characters.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        
        // Save to Database
        const dbRes = await db.query(
            'INSERT INTO users (name, email, mobile_number, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
            [name, email, mobileNumber || null, hash, 'Student']
        );

        const newUser = getResultRows(dbRes)[0] || { name, email, role: 'Student' };

        // Generate Transaction emails (Asynchronously dispatch without blocking response)
        emailService.sendRegistrationSuccessful(email, name).catch(err => {
            console.error('Async Registration Email Delivery failed:', err);
        });

        // Notify Admins
        await createNotification('USER_REGISTERED', `New Student/Parent account registered: ${name} (${email})`);

        return res.status(201).json({
            message: 'Registration successful! Welcome on board.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        if (error.message.includes('unique') || error.message.includes('exists')) {
            return res.status(400).json({ error: 'An account is already registered with this email address.' });
        }
        console.error('Registration API Error:', error);
        return res.status(500).json({ error: 'Server database failure. Try again later.' });
    }
};

router.post('/signup', handleRegistration);
router.post('/auth/register', handleRegistration);
router.post('/auth/signup', handleRegistration);

// 1.2 Portal User Login
const handleLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const fetchRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const matchedUser = getResultRows(fetchRes)[0];

        if (!matchedUser) {
            return res.status(401).json({ error: 'Invalid email address or passcode constraint.' });
        }

        const validPass = await bcrypt.compare(password, matchedUser.password);
        if (!validPass) {
            return res.status(401).json({ error: 'Invalid email address or passcode constraint.' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, role: matchedUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Store in session for layout views/multi-page compatibility
        if (req.session) {
            req.session.user = { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role };
        }

        return res.json({
            message: 'Login successful!',
            token,
            user: {
                id: matchedUser.id,
                name: matchedUser.name,
                email: matchedUser.email,
                role: matchedUser.role === 'Super Admin' || matchedUser.role === 'Staff' ? 'admin' : 'student'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server runtime authentication failure.' });
    }
};

router.post('/login', handleLogin);
router.post('/auth/login', handleLogin);

// 1.3 Separated Admin Login Route (to match backend routing schema and client requests)
const handleAdminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    try {
        const fetchRes = await db.query('SELECT * FROM users WHERE email = $1 AND (role = $2 OR role = $3)', [email, 'Super Admin', 'Staff']);
        const matchedAdmin = getResultRows(fetchRes)[0];

        if (!matchedAdmin) {
            return res.status(401).json({ error: 'Invalid admin credentials or unauthorized role.' });
        }

        const validPass = await bcrypt.compare(password, matchedAdmin.password);
        if (!validPass) {
            return res.status(401).json({ error: 'Invalid admin credentials or passcode mismatch.' });
        }

        const token = jwt.sign(
            { id: matchedAdmin.id, name: matchedAdmin.name, email: matchedAdmin.email, role: matchedAdmin.role },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Store in session for admin layout views/multi-page compatibility
        if (req.session) {
            req.session.user = { id: matchedAdmin.id, name: matchedAdmin.name, role: matchedAdmin.role };
        }

        return res.json({
            message: 'Admin access granted. Welcome to internal controls.',
            token,
            user: {
                id: matchedAdmin.id,
                name: matchedAdmin.name,
                email: matchedAdmin.email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin login controller failure:', error);
        return res.status(500).json({ error: 'Database authentication processing error.' });
    }
};

router.post('/admin-login', handleAdminLogin);
router.post('/auth/admin-login', handleAdminLogin);

// 1.4 Password Recovery system (Forgot and Reset Password)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email container is required.' });
    }

    try {
        const fetchRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = getResultRows(fetchRes)[0];

        if (!user) {
            // Act secure, do not leak existing email validation but notify client
            return res.status(200).json({ message: 'If this email exists in our records, a secure password reset link has been dispatched.' });
        }

        // Generate reset token string
        const secureToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 Min

        await db.query(
            'UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE email = $3',
            [secureToken, expiryTime, email]
        );

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const resetLink = `${protocol}://${req.get('host')}/reset-password.html?token=${secureToken}&email=${encodeURIComponent(email)}`;

        // Send Email (Asynchronously dispatch without blocking response)
        emailService.sendPasswordReset(email, user.name, resetLink).catch(err => {
            console.error('Async Password Reset Email Delivery failed:', err);
        });

        return res.status(200).json({ message: 'If this email exists in our records, a secure password reset link has been dispatched.' });
    } catch (error) {
        console.error('Forgot password endpoint error:', error);
        return res.status(500).json({ error: 'Recovery execution processing error.' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
        return res.status(400).json({ error: 'Missing mandatory email, token, or password fields.' });
    }

    try {
        const fetchRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = getResultRows(fetchRes)[0];

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired recovery details.' });
        }

        // Validate Token & expiry in production PG
        if (db.isProductionPG) {
            if (user.reset_token !== token || new Date(user.reset_expiry) < new Date()) {
                return res.status(400).json({ error: 'Recovery reset link is invalid or has expired (15 minute boundary).' });
            }
        }

        // Update password with hash
        const newHash = await bcrypt.hash(password, 10);
        await db.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_expiry = NULL WHERE email = $2',
            [newHash, email]
        );

        return res.json({ message: 'Password reset completed successfully! You can now log back in.' });
    } catch (error) {
        console.error('Reset password controller failure:', error);
        return res.status(500).json({ error: 'Password update transaction crashed.' });
    }
});

// 1.5 Fetch Authenticated Profile Session
const handleProfile = async (req, res) => {
    try {
        const userRes = await db.query('SELECT id, name, email, role, mobile_number FROM users WHERE id = $1', [req.user.id]);
        const userDetail = getResultRows(userRes)[0];
        if (!userDetail) {
            return res.status(404).json({ error: 'User profiles record wiped or inactive.' });
        }
        return res.json({ user: userDetail });
    } catch (error) {
        return res.status(500).json({ error: 'Server profile checking error.' });
    }
};

router.get('/me', verifyToken, handleProfile);
router.get('/auth/me', verifyToken, handleProfile);

// 1.6 Logout (Support both GET and POST for maximum compatibility with client pages)
router.get('/auth/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            return res.json({ message: 'Session key invalidated. Logout successful.' });
        });
    } else {
        return res.json({ message: 'Session key invalidated. Logout successful.' });
    }
});

router.post('/auth/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            return res.json({ message: 'Session key invalidated. Logout successful.' });
        });
    } else {
        return res.json({ message: 'Session key invalidated. Logout successful.' });
    }
});

router.use('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            return res.json({ message: 'Session key invalidated. Logout successful.' });
        });
    } else {
        return res.json({ message: 'Session key invalidated. Logout successful.' });
    }
});

/* ==========================================
   📝 2. ADMISSIONS MANAGEMENT API
   ========================================== */

// 2.1 Submit New Admission Form (With Attachments Support via Multer)
router.post('/admissions', admissionsUpload, async (req, res) => {
    const { studentName, parentName, contactPhone, emailAddress, applyingClass, prevSchool, resAddress, remarks } = req.body;

    if (!studentName || !parentName || !contactPhone || !emailAddress || !applyingClass) {
        return res.status(400).json({ error: 'Required fields: Student Name, Parent Name, Mobile, Email, and Target Class are missing.' });
    }

    // Resolve uploaded files paths relative to disk/public links
    const files = req.files || {};
    const photoPath = files.student_photo ? `/uploads/photos/${files.student_photo[0].filename}` : null;
    const aadhaarPath = files.aadhaar_card ? `/uploads/aadhaar/${files.aadhaar_card[0].filename}` : null;
    const tcPath = files.transfer_certificate ? `/uploads/tc/${files.transfer_certificate[0].filename}` : null;
    const marksPath = files.marks_card ? `/uploads/marks/${files.marks_card[0].filename}` : null;

    try {
        await db.query(`
            INSERT INTO admissions (
                student_name, parent_name, mobile, email, class_applied, address, previous_school, remarks, status, student_photo, aadhaar, transfer_certificate, marks_card
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9, $10, $11, $12)
        `, [
            studentName, parentName, contactPhone, emailAddress, applyingClass,
            resAddress || null, prevSchool || null, remarks || null,
            photoPath, aadhaarPath, tcPath, marksPath
        ]);

        // Transaction mailing alerts (Asynchronously dispatch without blocking response)
        emailService.sendAdmissionSubmitted(emailAddress, studentName, applyingClass).catch(err => {
            console.error('Async Admission Submitted Email Delivery failed:', err);
        });

        // System notification trigger
        await createNotification('NEW_ADMISSION', `New Admissions Application: ${studentName} applied for ${applyingClass}`);

        return res.status(201).json({ message: 'Aesthetic Admissions application completed and saved securely in DB.' });
    } catch (error) {
        console.error('Admission Insertion Error:', error);
        return res.status(500).json({ error: 'Admissions transaction insert crashed on parent database.' });
    }
});

// 2.2 View admissions with sorting/filter checks (Super Admin/Staff limits)
router.get('/admissions', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
        const listRes = await db.query('SELECT * FROM admissions ORDER BY created_at DESC');
        return res.json(getResultRows(listRes));
    } catch (error) {
        console.error('Admissions view failed:', error);
        return res.status(500).json({ error: 'Failed to extract admissions query list.' });
    }
});

// 2.3 Approve or Reject Admission applications
router.put('/admissions/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Approved or Rejected or Pending

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid state transition requested.' });
    }

    try {
        // Find prior details
        const detailsRes = await db.query('SELECT * FROM admissions WHERE id = $1', [id]);
        const targetAdm = getResultRows(detailsRes)[0];

        if (!targetAdm) {
            return res.status(404).json({ error: 'Target admissions file not found.' });
        }

        await db.query('UPDATE admissions SET status = $1 WHERE id = $2', [status, id]);

        // Notification mailing based on status outcome
        if (status === 'Approved') {
            emailService.sendAdmissionApproved(targetAdm.email, targetAdm.student_name, targetAdm.class_applied).catch(err => {
                console.error('Async Admission Approved Email Delivery failed:', err);
            });
            
            // Auto generation of associated Student and User ledger:
            // Insert User if not duplicate
            const uRes = await db.query('SELECT id FROM users WHERE email = $1', [targetAdm.email]);
            let sUserId = getResultRows(uRes)[0]?.id;
            if (!sUserId) {
                const defaultPass = await bcrypt.hash('student123', 10);
                const userCreate = await db.query(`
                    INSERT INTO users (name, email, mobile_number, password, role) 
                    VALUES ($1, $2, $3, $4, 'Student') RETURNING id
                `, [targetAdm.student_name, targetAdm.email, targetAdm.mobile, defaultPass]);
                sUserId = getResultRows(userCreate)[0]?.id;
            }

            // Insert Student ledger details with full academic and personal fields
            const checkStudent = await db.query('SELECT id FROM students WHERE admission_id = $1', [id]);
            if (getResultRows(checkStudent).length === 0) {
                const sIdStr = `STU${Math.floor(1000 + Math.random() * 9000)}`;
                const aNumStr = `ADM${Math.floor(1000 + Math.random() * 9000)}`;
                await db.query(`
                    INSERT INTO students (
                        user_id, admission_id, class, parent_name, status,
                        student_id, admission_number, full_name, section, gender, dob, phone, email, address
                    ) VALUES ($1, $2, $3, $4, 'Active', $5, $6, $7, 'A', 'Not Specified', 'Not Specified', $8, $9, $10)
                `, [
                    sUserId, id, targetAdm.class_applied, targetAdm.parent_name,
                    sIdStr, aNumStr, targetAdm.student_name, targetAdm.mobile, targetAdm.email, targetAdm.address
                ]);
            }
        } else if (status === 'Rejected') {
            emailService.sendAdmissionRejected(targetAdm.email, targetAdm.student_name).catch(err => {
                console.error('Async Admission Rejected Email Delivery failed:', err);
            });
        }

        // Notify admins log
        await createNotification('ADMISSION_UPDATED', `Admissions ID ${id} is marked as '${status}' for student ${targetAdm.student_name}`);

        return res.json({ message: `Admissions index state updated to: ${status}` });
    } catch (error) {
        console.error('Admission state change failed:', error);
        return res.status(500).json({ error: 'Admission status transition update crashed.' });
    }
});

// 2.4 Delete Admission
router.delete('/admissions/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM admissions WHERE id = $1', [id]);
        return res.json({ message: 'Admission form index deleted fully from active databases.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to perform destructive admissions deletion query.' });
    }
});

/* ==========================================
   📞 3. CONTACT MESSAGES API
   ========================================== */

router.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Full Name, Email and Message details container are mandatory.' });
    }

    try {
        await db.query(
            'INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4)',
            [name, email, subject || 'General Query Enquiry', message]
        );

        // Send transactional receipt (Asynchronously dispatch without blocking response)
        emailService.sendContactReceived(email, name, subject).catch(err => {
            console.error('Async Contact Received Email Delivery failed:', err);
        });

        // Notify system admin
        await createNotification('NEW_MESSAGE', `New inquiry message received from ${name} of subject: "${subject || 'General Enquiry'}"`);

        return res.status(201).json({ message: 'Message logged and notifications generated successfully!' });
    } catch (error) {
        console.error('Contact submit API failure:', error);
        return res.status(500).json({ error: 'Contact messages queue insertion crashed.' });
    }
});

// Admin Get Messages
router.get('/messages', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
        const listRes = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
        return res.json(getResultRows(listRes));
    } catch (error) {
        return res.status(500).json({ error: 'Error queries active message log.' });
    }
});

// Admin Reply/Update messages
router.put('/messages/:id/read', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE messages SET is_read = TRUE WHERE id = $1', [id]);
        return res.json({ message: 'Message marked read.' });
    } catch (error) {
        return res.status(500).json({ error: 'Message status update query failed.' });
    }
});

router.delete('/messages/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM messages WHERE id = $1', [id]);
        return res.json({ message: 'Message logs row deleted.' });
    } catch (error) {
        return res.status(500).json({ error: 'Destructive messages row delete failed.' });
    }
});

/* ==========================================
   👥 4. STUDENT AND USERS DB MANAGEMENT API
   ========================================== */

// 4.1 Admin Get Users List (Filter roles if asked)
router.get('/users', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
        const listRes = await db.query('SELECT id, name, email, mobile_number, role, created_at FROM users ORDER BY id ASC');
        return res.json(getResultRows(listRes));
    } catch (error) {
        return res.status(500).json({ error: 'Users extraction filter query failed.' });
    }
});

// 4.2 Admin Add New Student/User manually
router.post('/users', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { name, email, mobileNumber, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing standard student profile variables.' });
    }

    try {
        const uPass = await bcrypt.hash(password, 10);
        const newUserRes = await db.query(`
            INSERT INTO users (name, email, mobile_number, password, role)
            VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role
        `, [name, email, mobileNumber || null, uPass, role]);

        const freshUser = getResultRows(newUserRes)[0] || { name, email, role };

        // If Student role, also instantiate matching row in students table
        if (role === 'Student') {
            await db.query(`
                INSERT INTO students (user_id, class, status)
                VALUES ($1, 'Class 1', 'Active')
            `, [freshUser.id]);
        }

        return res.status(201).json({ message: 'User ledger manually allocated.', user: freshUser });
    } catch (error) {
         if (error.message.includes('unique') || error.message.includes('exists')) {
            return res.status(400).json({ error: 'An account is already registered with this email address.' });
         }
         return res.status(500).json({ error: 'Error manually seeding student records.' });
    }
});

// 4.3 Admin Update Student/User profile details
router.put('/users/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { name, email, mobileNumber, role } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ error: 'Essential Student details are missing in update.' });
    }

    try {
        await db.query(`
            UPDATE users SET name = $1, email = $2, mobile_number = $3, role = $4 WHERE id = $5
        `, [name, email, mobileNumber || null, role, id]);
        return res.json({ message: 'User metadata updated successfully.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed updating associated student profile.' });
    }
});

// 4.4 Admin Destroy Student/User
router.delete('/users/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        return res.json({ message: 'User accounts profile destructively purges.' });
    } catch (error) {
        return res.status(500).json({ error: 'Erase actions of student query crashed.' });
    }
});

// 4.5 Admin students-specific detail grid extraction (CRUD)
router.get('/students', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
        const studRes = await db.query('SELECT * FROM students ORDER BY id DESC');
        return res.json(getResultRows(studRes));
    } catch (error) {
        return res.status(500).json({ error: 'Failed to resolve Student detail tables.' });
    }
});

router.get('/students/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM students WHERE id = $1', [id]);
        const matched = getResultRows(result);
        if (matched.length === 0) {
            return res.status(404).json({ error: 'Student profile not found.' });
        }
        return res.json(matched[0]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to retrieve Student records.' });
    }
});

router.post('/students', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const {
        user_id, admission_id, academic_year, class: sClass, status, parent_name,
        student_id, admission_number, full_name, section, gender, dob, phone, email, address
    } = req.body;

    if (!student_id || !admission_number || !full_name) {
        return res.status(400).json({ error: 'Student ID, Admission Number and Full Name are required.' });
    }

    try {
        const result = await db.query(`
            INSERT INTO students (
                user_id, admission_id, academic_year, class, status, parent_name,
                student_id, admission_number, full_name, section, gender, dob, phone, email, address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `, [
            user_id || null, admission_id || null, academic_year || '2026-27', sClass || null, status || 'Active', parent_name || null,
            student_id, admission_number, full_name, section || null, gender || null, dob || null, phone || null, email || null, address || null
        ]);
        return res.status(201).json(getResultRows(result)[0]);
    } catch (error) {
        console.error('Error adding student:', error);
        return res.status(500).json({ error: error.message || 'Failed adding student record.' });
    }
});

router.put('/students/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const {
        user_id, admission_id, academic_year, class: sClass, status, parent_name,
        student_id, admission_number, full_name, section, gender, dob, phone, email, address
    } = req.body;

    try {
        await db.query(`
            UPDATE students SET
                user_id = $1, admission_id = $2, academic_year = $3, class = $4, status = $5, parent_name = $6,
                student_id = $7, admission_number = $8, full_name = $9, section = $10, gender = $11, dob = $12,
                phone = $13, email = $14, address = $15
            WHERE id = $16
        `, [
            user_id || null, admission_id || null, academic_year, sClass, status, parent_name,
            student_id, admission_number, full_name, section, gender, dob, phone, email, address,
            id
        ]);
        return res.json({ message: 'Student profile updated successfully.' });
    } catch (error) {
        console.error('Error updating student:', error);
        return res.status(500).json({ error: 'Failed updating Student record.' });
    }
});

router.delete('/students/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
         await db.query('DELETE FROM students WHERE id = $1', [id]);
         return res.json({ message: 'Student record purged from system.' });
    } catch (error) {
         return res.status(500).json({ error: 'Failed purging Student record.' });
    }
});

// 4.6 Parents Registry endpoints (CRUD)
router.get('/parents', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
         const parentsRes = await db.query('SELECT * FROM parents ORDER BY id DESC');
         return res.json(getResultRows(parentsRes));
    } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve Parent registries.' });
    }
});

router.get('/parents/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    try {
         const result = await db.query('SELECT * FROM parents WHERE id = $1', [id]);
         const matched = getResultRows(result);
         if (matched.length === 0) {
             return res.status(404).json({ error: 'Parent record not found.' });
         }
         return res.json(matched[0]);
    } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve Parent record.' });
    }
});

router.post('/parents', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { parent_id, father_name, mother_name, phone, email, address, linked_students } = req.body;
    if (!parent_id || !father_name) {
         return res.status(400).json({ error: 'Parent ID and Father Name are required.' });
    }
    try {
         const result = await db.query(`
             INSERT INTO parents (parent_id, father_name, mother_name, phone, email, address, linked_students)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *
         `, [parent_id, father_name, mother_name || null, phone || null, email || null, address || null, linked_students || null]);
         return res.status(201).json(getResultRows(result)[0]);
    } catch (error) {
         console.error('Error adding parent:', error);
         return res.status(500).json({ error: error.message || 'Failed adding Parent record.' });
    }
});

router.put('/parents/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { parent_id, father_name, mother_name, phone, email, address, linked_students } = req.body;
    try {
         await db.query(`
             UPDATE parents SET parent_id = $1, father_name = $2, mother_name = $3, phone = $4, email = $5, address = $6, linked_students = $7
             WHERE id = $8
         `, [parent_id, father_name, mother_name, phone, email, address, linked_students, id]);
         return res.json({ message: 'Parent profile updated successfully.' });
    } catch (error) {
         console.error('Error updating parent:', error);
         return res.status(500).json({ error: 'Failed updating Parent record.' });
    }
});

router.delete('/parents/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
         await db.query('DELETE FROM parents WHERE id = $1', [id]);
         return res.json({ message: 'Parent record purged from system.' });
    } catch (error) {
         return res.status(500).json({ error: 'Failed purging Parent record.' });
    }
});

/* ==========================================
   📢 5. CONTENT MANAGEMENT API (Announcements, Notices & Events)
   ========================================== */

// 5.1 Announcements Routes
router.get('/announcements', async (req, res) => {
    try {
        const list = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
        return res.json(getResultRows(list));
    } catch (error) {
        return res.status(500).json({ error: 'Failed retrieving announcements.' });
    }
});

router.post('/announcements', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { title, description, category } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and Description are required.' });
    }
    try {
        const item = await db.query(`
            INSERT INTO announcements (title, description, category)
            VALUES ($1, $2, $3) RETURNING *
        `, [title, description, category || 'General']);
        return res.status(201).json(getResultRows(item)[0]);
    } catch (error) {
        return res.status(500).json({ error: 'Announcements creation failed.' });
    }
});

router.put('/announcements/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { title, description, category } = req.body;
    try {
        await db.query(`
            UPDATE announcements SET title = $1, description = $2, category = $3 WHERE id = $4
        `, [title, description, category, id]);
        return res.json({ message: 'Announcement edited.' });
    } catch (error) {
        return res.status(500).json({ error: 'Announcements edit failed.' });
    }
});

router.delete('/announcements/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM announcements WHERE id = $1', [id]);
        return res.json({ message: 'Announcement wiped.' });
    } catch (error) {
         return res.status(500).json({ error: 'Announcements purge failed.' });
    }
});

// 5.2 Board Events Routes
router.get('/events', async (req, res) => {
    try {
        const list = await db.query('SELECT * FROM events ORDER BY date ASC');
        return res.json(getResultRows(list));
    } catch (error) {
        return res.status(500).json({ error: 'Failed retrieving school calendar events.' });
    }
});

router.post('/events', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { title, date, location, description } = req.body;
    if (!title || !date) {
        return res.status(400).json({ error: 'Title and event target Date details are mandatory.' });
    }
    try {
        const item = await db.query(`
            INSERT INTO events (title, date, location, description)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [title, date, location || 'School Campus', description || null]);
        return res.status(201).json(getResultRows(item)[0]);
    } catch (error) {
        return res.status(500).json({ error: 'Events addition query failed.' });
    }
});

router.put('/events/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { title, date, location, description } = req.body;
    try {
        await db.query(`
            UPDATE events SET title = $1, date = $2, location = $3, description = $4 WHERE id = $5
        `, [title, date, location, description, id]);
        return res.json({ message: 'Events details updated.' });
    } catch (error) {
         return res.status(500).json({ error: 'Events update query failed.' });
    }
});

router.delete('/events/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM events WHERE id = $1', [id]);
        return res.json({ message: 'Events deleted from calendar.' });
    } catch (error) {
        return res.status(500).json({ error: 'Events deletion query crashed.' });
    }
});

/* ==========================================
   🔔 6. ALERTS NOTIFICATIONS API
   ========================================== */

router.get('/notifications', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
        const notifResult = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
        const list = getResultRows(notifResult);
        const unreadCount = list.filter(n => !n.is_read).length;
        return res.json({ list, unreadCount });
    } catch (error) {
        return res.status(500).json({ error: 'Alert notification logging extract crashed.' });
    }
});

router.put('/notifications/:id/read', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
        return res.json({ message: 'Alert notification flagged as checked.' });
    } catch (error) {
         return res.status(500).json({ error: 'Alert status update query failed.' });
    }
});

/* ==========================================
   👥 8. TEACHER MANAGEMENT API (ERP WORKSPACE)
   ========================================== */

router.get('/teachers', verifyToken, async (req, res) => {
    try {
        const teachersRes = await db.query('SELECT * FROM teachers ORDER BY id DESC');
        return res.json(getResultRows(teachersRes));
    } catch (error) {
        console.error('Failed fetching teachers:', error);
        return res.status(500).json({ error: 'Failed fetching teachers list.' });
    }
});

router.get('/teachers/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM teachers WHERE id = $1', [id]);
        const matched = getResultRows(result);
        if (matched.length === 0) {
            return res.status(404).json({ error: 'Teacher profile not found.' });
        }
        return res.json(matched[0]);
    } catch (error) {
        return res.status(500).json({ error: 'Failed retrieving teacher profile.' });
    }
});

router.post('/teachers', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const {
        teacher_id, employee_code, full_name, photo, gender, dob,
        qualification, experience, subject, assigned_class,
        mobile_number, email, address, joining_date, salary,
        aadhaar_number, status, username, password, documents
    } = req.body;

    if (!teacher_id || !employee_code || !full_name || !email) {
        return res.status(400).json({ error: 'Teacher ID, Employee Code, Full Name and Email are mandatory fields.' });
    }

    try {
        const result = await db.query(`
            INSERT INTO teachers (
                teacher_id, employee_code, full_name, photo, gender, dob,
                qualification, experience, subject, assigned_class,
                mobile_number, email, address, joining_date, salary,
                aadhaar_number, status, username, password, documents
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *
        `, [
            teacher_id, employee_code, full_name, photo || null, gender || null, dob || null,
            qualification || null, experience || null, subject || null, assigned_class || null,
            mobile_number || null, email, address || null, joining_date || null, salary || null,
            aadhaar_number || null, status || 'Active', username || null, password || null,
            typeof documents === 'string' ? documents : JSON.stringify(documents || [])
        ]);
        return res.status(201).json(getResultRows(result)[0]);
    } catch (error) {
        console.error('Error inserting teacher:', error);
        return res.status(500).json({ error: error.message || 'Failed adding new teacher profile.' });
    }
});

router.put('/teachers/:id', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const {
        teacher_id, employee_code, full_name, photo, gender, dob,
        qualification, experience, subject, assigned_class,
        mobile_number, email, address, joining_date, salary,
        aadhaar_number, status, username, password, documents
    } = req.body;

    try {
        await db.query(`
            UPDATE teachers SET
                teacher_id = $1, employee_code = $2, full_name = $3, photo = $4, gender = $5, dob = $6,
                qualification = $7, experience = $8, subject = $9, assigned_class = $10,
                mobile_number = $11, email = $12, address = $13, joining_date = $14, salary = $15,
                aadhaar_number = $16, status = $17, username = $18, password = $19, documents = $20
            WHERE id = $21
        `, [
            teacher_id, employee_code, full_name, photo, gender, dob,
            qualification, experience, subject, assigned_class,
            mobile_number, email, address, joining_date, salary,
            aadhaar_number, status, username, password,
            typeof documents === 'string' ? documents : JSON.stringify(documents || []),
            id
        ]);
        return res.json({ message: 'Teacher profile updated successfully.' });
    } catch (error) {
        console.error('Error updating teacher:', error);
        return res.status(500).json({ error: 'Failed updating teacher profile.' });
    }
});

router.put('/teachers/:id/class', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { assigned_class } = req.body;
    try {
        await db.query('UPDATE teachers SET assigned_class = $1 WHERE id = $2', [assigned_class, id]);
        return res.json({ message: 'Teacher assigned class updated.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed assigning class slot.' });
    }
});

router.put('/teachers/:id/subject', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { subject } = req.body;
    try {
        await db.query('UPDATE teachers SET subject = $1 WHERE id = $2', [subject, id]);
        return res.json({ message: 'Teacher subject updated.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed assigning subject outline.' });
    }
});

router.put('/teachers/:id/status', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE teachers SET status = $1 WHERE id = $2', [status, id]);
        return res.json({ message: 'Teacher status changed.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed updating status.' });
    }
});

router.delete('/teachers/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM teachers WHERE id = $1', [id]);
        return res.json({ message: 'Teacher profile purged from directory successfully.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed purging teacher profile.' });
    }
});

/* ==========================================
   📊 7. CORE ADMIN STATS INDEX AGGREGATES
   ========================================== */

router.get('/admin/stats', verifyToken, authorizeRoles('Super Admin', 'Staff'), async (req, res) => {
    try {
        // Collect aggregates safely across Postgres and persistent local DB
        const admsRes = await db.query('SELECT status, COUNT(*) as count FROM admissions GROUP BY status');
        const admsResult = getResultRows(admsRes);
        
        let totalAdmissions = 0;
        let pendingAdmissions = 0;
        let approvedAdmissions = 0;
        let rejectedAdmissions = 0;

        admsResult.forEach(row => {
            const count = parseInt(row.count || 0);
            totalAdmissions += count;
            if (row.status === 'Pending') pendingAdmissions = count;
            else if (row.status === 'Approved') approvedAdmissions = count;
            else if (row.status === 'Rejected') rejectedAdmissions = count;
        });

        const studentsRes = await db.query('SELECT COUNT(*) as count FROM students');
        const totalStudents = parseInt(getResultRows(studentsRes)[0]?.count || 0);

        const messagesRes = await db.query('SELECT COUNT(*) as count FROM messages');
        const contactMessagesCount = parseInt(getResultRows(messagesRes)[0]?.count || 0);

        const usersRes = await db.query('SELECT COUNT(*) as count FROM users');
        const registeredUsersCount = parseInt(getResultRows(usersRes)[0]?.count || 0);

        return res.json({
            totalAdmissions,
            pendingAdmissions,
            approvedAdmissions,
            rejectedAdmissions,
            totalStudents,
            contactMessages: contactMessagesCount,
            registeredUsers: registeredUsersCount
        });
    } catch (error) {
        console.error('Core admin metrics aggregation crashed:', error);
        return res.status(500).json({ error: 'Stats query aggregates compilation failed.' });
    }
});

module.exports = router;
