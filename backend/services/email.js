const nodemailer = require('nodemailer');

let transporterInstance = null;

// Lazy initialize transporter to prevent crashes if credentials are unset
const getTransporter = () => {
    if (!transporterInstance) {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (user && pass && user !== 'your-email@gmail.com') {
            const host = process.env.EMAIL_HOST;
            if (host) {
                const port = parseInt(process.env.EMAIL_PORT || '465');
                const secure = process.env.EMAIL_SECURE !== 'false';
                transporterInstance = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: { user, pass },
                    tls: {
                        rejectUnauthorized: false
                    }
                });
            } else {
                transporterInstance = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user, pass }
                });
            }
            console.log('Nodemailer initialized successfully.');
        } else {
            // Null transporter returns null gracefully
            return null;
        }
    }
    return transporterInstance;
};

// Core sending orchestrator with elegant HTML branding templates
const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = getTransporter();
    
    // Aesthetic email wrapper template
    const brandedHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="background-color: #0f1f3f; padding: 25px; text-align: center;">
                <h1 style="color: #facd15; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">MAJESTIC SCHOOL</h1>
                <p style="color: #cbd5e1; margin: 5px 0 0; font-size: 13px; font-weight: 500;">Learning Discipline, Securing Success</p>
            </div>
            <div style="padding: 35px; color: #334155; background-color: #ffffff; line-height: 1.6;">
                ${html}
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
                <p style="margin: 0;">This is an automated notification from Majestic Primary & High School Mysuru.</p>
                <p style="margin: 5px 0 0;">© 2026 Majestic High School. All rights reserved.</p>
            </div>
        </div>
    `;

    const sender = process.env.EMAIL_SENDER || process.env.EMAIL_USER || 'no-reply@majesticschoolmysore.com';

    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"Majestic Primary & High School" <${sender}>`,
                to,
                subject,
                text,
                html: brandedHtml
            });
            console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
            return true;
        } catch (error) {
            console.error('[EMAIL ERROR] Failed to deliver transaction email!');
            console.error('  └ Destination:', to);
            console.error('  └ Subject:', subject);
            console.error('  └ Error Message:', error.message);
            console.error('  └ Error Stack:', error.stack || error);
            console.error('  └ SMTP Config:', {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: process.env.EMAIL_SECURE,
                user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'undefined'
            });
            return false;
        }
    } else {
        // Safe logger fallback so preview never fails
        console.log(`
==================================================
📨 [SMTP DEVMOCK NOTIFICATION] Email is queued to go:
TO: ${to}
SUBJECT: ${subject}
TEXT CONTENT: ${text}
==================================================
        `);
        return true;
    }
};

// High-level specific transactional templates
const sendRegistrationSuccessful = async (email, name) => {
    return sendEmail({
        to: email,
        subject: 'Welcome to the Majestic School Family',
        text: `Dear ${name},\n\nWelcome to Majestic Primary & High School.\n\nThank you for joining our school community.\n\nYour account has been successfully created and you can now access the portal.\n\nWe are delighted to welcome you to the Majestic Family.\n\nRegards,\n\nMajestic Primary & High School\nMysuru`,
        html: `
            <div style="font-family: inherit; line-height: 1.6; color: #334155;">
                <p>Dear ${name},</p>
                <p>Welcome to Majestic Primary & High School.</p>
                <p>Thank you for joining our school community.</p>
                <p>Your account has been successfully created and you can now access the portal.</p>
                <p>We are delighted to welcome you to the Majestic Family.</p>
                <br>
                <p>Regards,</p>
                <p><strong>Majestic Primary & High School</strong><br>Mysuru</p>
            </div>
        `
    });
};

const sendAdmissionSubmitted = async (email, studentName, classApplied) => {
    return sendEmail({
        to: email,
        subject: 'Admission Application Received - Majestic School',
        text: `Dear Parent, Thank you for applying for ${studentName} for class ${classApplied}. We have received your query.`,
        html: `
            <h2 style="color: #0f1f3f; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">Application Under Review</h2>
            <p>Thank you for submitting your online registration enquiry for <strong>${studentName}</strong> (applying for ${classApplied}).</p>
            <p>Our academic administration and intake committee has queued this file for review. A representative will contact you in 2 to 3 working days.</p>
            <p>Please preserve this email for admission references.</p>
        `
    });
};

const sendAdmissionApproved = async (email, studentName, classApplied) => {
    return sendEmail({
        to: email,
        subject: 'Congratulations! Admission Approved at Majestic School',
        text: `Dear Parent, Congratulations! The admission application for ${studentName} has been approved for Class ${classApplied}.`,
        html: `
            <h2 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">🎉 Admission Approved!</h2>
            <p>We are proud to inform you that the admission application for <strong>${studentName}</strong> has been officially <strong>Approved</strong> for academic year 2026-27.</p>
            <p style="font-size: 15px; background: #ecfdf5; padding: 15px; border-radius: 8px; color: #047857; font-weight: 600;">
                A student seat has been allocated. Please visit the school campus counter within the next 5 working days to pay the first installment and complete verification documentation.
            </p>
            <p>We look forward to partnering with you on your child's brilliant path ahead!</p>
        `
    });
};

const sendAdmissionRejected = async (email, studentName) => {
    return sendEmail({
        to: email,
        subject: 'Admission Update - Majestic School',
        text: `Dear Parent, We regret to inform you that we cannot offer admission for ${studentName} at this point.`,
        html: `
            <h2 style="color: #dc2626; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">Admission Enquiry Update</h2>
            <p>Thank you for your interest in Majestic Primary & High School.</p>
            <p>After reviewing our current capacity controls and seats, we regret to inform you that we are unable to process your admission application for <strong>${studentName}</strong> further at this time.</p>
            <p>We wish you and your student the very best in all academic pursuits.</p>
        `
    });
};

const sendPasswordReset = async (email, name, resetLink) => {
    return sendEmail({
        to: email,
        subject: 'Secure Password Reset Link - Majestic School',
        text: `Dear ${name}, You requested a password reset. Click this link: ${resetLink}. Valid for 15 minutes.`,
        html: `
            <h2 style="color: #0f1f3f; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>A request was received to reset the password for your Majestic School Portal account.</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #facd15; color: #0f1f3f; font-weight: 800; padding: 14px 28px; text-decoration: none; border-radius: 50px; display: inline-block;">Reset Password Now</a>
            </p>
            <p style="font-size: 11px; color: #94a3b8;">This secure reset link has built-in expirations and is only active for 15 minutes. If you did not trigger this request, you can safely ignore this email.</p>
        `
    });
};

const sendContactReceived = async (email, name, subject) => {
    return sendEmail({
        to: email,
        subject: 'We Received Your Message - Majestic School',
        text: `Dear ${name}, Thank you for writing to Majestic Primary & High School. We have received your query.`,
        html: `
            <h2 style="color: #0f1f3f; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">Message Received</h2>
            <p>Dear ${name},</p>
            <p>Thank you for getting in touch with us regarding: <strong>"${subject}"</strong>.</p>
            <p>Our administrative desk has received your contact ticket in the database. We will reply to your registered email address shortly.</p>
        `
    });
};

const sendAdminAlert = async (type, message) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@majesticschoolmysore.com';
    return sendEmail({
        to: adminEmail,
        subject: `[ADMIN ALERT] ${type}`,
        text: `System alert notification: ${message}`,
        html: `
            <h2 style="color: #0f1f3f; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">System Notification Alert</h2>
            <p>The system has logged a new management notification of type <strong>${type}</strong>:</p>
            <p style="font-size: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0f1f3f; color: #334155; font-weight: 500;">
                ${message}
            </p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 25px;">Logged directly via Majestic Primary & High School ERP core admin module.</p>
        `
    });
};

const isSMTPConfigured = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    return !!(user && pass && user !== 'your-email@gmail.com');
};

module.exports = {
    sendRegistrationSuccessful,
    sendAdmissionSubmitted,
    sendAdmissionApproved,
    sendAdmissionRejected,
    sendPasswordReset,
    sendContactReceived,
    sendAdminAlert,
    isSMTPConfigured
};
