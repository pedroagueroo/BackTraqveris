const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Error SMTP:", error.message);
    } else {
        console.log(`✅ Mail SMTP listo (${process.env.SMTP_FROM_NAME || 'Traveris Pro'})`);
    }
});

module.exports = transporter;

