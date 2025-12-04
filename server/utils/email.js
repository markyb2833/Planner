const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create email transporter - supports Gmail or any SMTP service
 */
const createTransporter = () => {
    // If using Gmail service (simpler)
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || process.env.GMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    // Otherwise use standard SMTP config (for SendGrid, Resend, etc.)
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || process.env.GMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD
        }
    });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, username, resetToken) => {
    const transporter = createTransporter();

    // Use production URL or fall back to localhost for development
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER,
        to: email,
        subject: 'Password Reset - Planner App',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>Hello ${username},</p>
                <p>You requested to reset your password. Click the link below to reset it:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Reset Password
                </a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666;">${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">Planner App</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send page invitation email
 */
const sendPageInvitationEmail = async (recipientEmail, recipientUsername, inviterUsername, pageName) => {
    const transporter = createTransporter();

    // Use production URL or fall back to localhost for development
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/invitations`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER,
        to: recipientEmail,
        subject: `${inviterUsername} invited you to collaborate on "${pageName}"`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Page Collaboration Invitation</h2>
                <p>Hello ${recipientUsername},</p>
                <p><strong>${inviterUsername}</strong> has invited you to collaborate on the page: <strong>${pageName}</strong></p>
                <a href="${acceptUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Invitation
                </a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666;">${acceptUrl}</p>
                <p>Log in to your account to accept or decline this invitation.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">Planner App</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPageInvitationEmail
};
