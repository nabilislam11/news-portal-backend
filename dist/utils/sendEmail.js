"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const verificationEmail_1 = require("../templates/verificationEmail");

const transporter = nodemailer_1.default.createTransport({
  service: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_FROM_ADDRESS,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});
// Function to get the correct email subject based on template type
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
// Function to get the correct email template
const getEmailTemplate = (type, data) => {
  switch (type) {
    case "verification":
      return (0, verificationEmail_1.verificationEmailTemplate)(data);
    default:
      throw new Error("No email template found for this type.");
  }
};

// Global Email Sending Function
async function sendEmail(to, type, data) {
  try {
    const subject = getEmailSubject(type);
    const emailHtml = getEmailTemplate(type, data);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM_ADDRESS,
      to: to,
      subject: subject,
      html: emailHtml,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Failed to send email. Please try again later.");
  }
}
