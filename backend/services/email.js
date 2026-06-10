const nodemailer = require('nodemailer');

let transporterInstance = null;

// Lazy initialize transporter to prevent crashes if credentials are unset
const getTransporter = () => {
    if (!transporterInstance) {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (user && pass && user !== 'your-email@gmail.com') {
            transporterInstance = nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass }
            });
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

    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"Majestic School Admin" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html: brandedHtml
            });
            console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
            return true;
        } catch (error) {
            console.error('[EMAIL ERROR] Failed to deliver transaction email:', error.message);
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
        subject: 'Welcome to Majestic Primary & High School!',
        text: `Dear ${name}, Your student registration has been created successfully. You can now login to see your student dashboard.`,
        html: `
            <h2 style="color: #0f1f3f; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">Welcome ${name}!</h2>
            <p>We are delighted to confirm that your student account has been created successfully at Majestic Primary & High School.</p>
            <p style="font-size: 15px; background: #e0f2fe; padding: 15px; border-radius: 8px; color: #0369a1; font-weight: 600;">
                🔒 You can now login to your Student & Parent Portal using your registered email address and password.
            </p>
            <p>If you have any questions during onboarding, feel free to reply directly to this message or call our helpdesk.</p>
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

module.exports = {
    sendRegistrationSuccessful,
    sendAdmissionSubmitted,
    sendAdmissionApproved,
    sendAdmissionRejected,
    sendPasswordReset,
    sendContactReceived
};
