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
        html: `<b>Your verification code is: ${code}</b><br/>It expires in 15 minutes.`,
    });
    console.log("Message sent: %s", info.messageId);
    console.log("🚀 [LOCAL DEV] Verification Code is:", code);
    // Preview only available when sending through an Ethereal account
    const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
    if (previewUrl) {
        console.log("Preview URL: %s", previewUrl);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
