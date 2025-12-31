"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const verificationEmail_1 = require("../templates/verificationEmail");
// 1. Initialize Resend
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const getEmailSubject = (template) => {
    switch (template) {
        case "verification":
            return "Verification Email from " + process.env.APP_NAME;
        case "passwordReset":
            return "Password Reset Request";
        default:
            throw new Error("No email subject found for this type.");
    }
};
const getEmailTemplate = (type, data) => {
    switch (type) {
        case "verification":
            return (0, verificationEmail_1.verificationEmailTemplate)(data);
        default:
            throw new Error("No email template found for this type.");
    }
};
async function sendEmail(to, type, data) {
    try {
        const subject = getEmailSubject(type);
        const emailHtml = getEmailTemplate(type, data);
        const response = await resend.emails.send({
            from: "noreply@protidinjonotarnews.com",
            to: to,
            subject: subject,
            html: emailHtml,
        });
        if (response.error) {
            console.error("Resend API Error:", response.error);
            throw new Error("Failed to send email via Resend.");
        }
        console.log(`Email sent successfully to ${to} (ID: ${response.data?.id})`);
    }
    catch (err) {
        console.error("Error sending email:", err);
        throw new Error("Failed to send email. Please try again later.");
    }
}
//# sourceMappingURL=sendEmail.js.map