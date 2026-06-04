"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("../config/env"));
let transporter;
const initializeTransporter = async () => {
    if (env_1.default.smtpUser && env_1.default.smtpPass) {
        transporter = nodemailer_1.default.createTransport({
            host: env_1.default.smtpHost,
            port: env_1.default.smtpPort,
            secure: env_1.default.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: env_1.default.smtpUser,
                pass: env_1.default.smtpPass,
            },
        });
    }
    else {
        // Fallback to Ethereal email for testing if no credentials are provided
        console.log('No SMTP credentials found, creating Ethereal test account...');
        const testAccount = await nodemailer_1.default.createTestAccount();
        transporter = nodemailer_1.default.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('Ethereal test account created.');
    }
};
initializeTransporter();
const sendVerificationEmail = async (to, code) => {
    if (!transporter) {
        await initializeTransporter();
    }
    const info = await transporter.sendMail({
        from: '"Stock Volatility App" <noreply@stockvolatility.com>',
        to,
        subject: "Your Verification Code",
        text: `Your verification code is: ${code}. It expires in 15 minutes.`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Stock Volatility Forecaster</h1>
                </div>
                <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 32px 24px; text-align: center; margin-bottom: 32px;">
                    <p style="color: #475569; font-size: 16px; margin-top: 0; margin-bottom: 16px;">Here is your secure verification code to access your account:</p>
                    <div style="font-size: 40px; font-weight: 800; color: #2563eb; letter-spacing: 8px; margin: 24px 0; padding: 16px; background: #ffffff; border-radius: 6px; border: 1px dashed #cbd5e1; display: inline-block;">
                        ${code}
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">For security purposes, this code will expire in exactly <b>15 minutes</b>.</p>
                </div>
                <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">If you did not request this verification code, please ignore this email or contact support if you have concerns.</p>
                </div>
            </div>
        `,
    });
    console.log("Message sent: %s", info.messageId);
    console.log("[LOCAL DEV] Verification Code is:", code);
    // Preview only available when sending through an Ethereal account
    const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
    if (previewUrl) {
        console.log("Preview URL: %s", previewUrl);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
