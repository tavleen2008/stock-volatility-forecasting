import nodemailer from 'nodemailer';
import config from '../config/env';

let transporter: nodemailer.Transporter;

const initializeTransporter = async () => {
    if (config.smtpUser && config.smtpPass) {
        transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: config.smtpUser,
                pass: config.smtpPass,
            },
        });
    } else {
        // Fallback to Ethereal email for testing if no credentials are provided
        console.log('No SMTP credentials found, creating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
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

export const sendVerificationEmail = async (to: string, code: string) => {
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
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log("Preview URL: %s", previewUrl);
    }
};
