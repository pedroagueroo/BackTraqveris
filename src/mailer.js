const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false para puerto 587 (StartTLS)
  auth: {
    user: "aguerop47@gmail.com",
    pass: "dywcncqshpaleulz" // Probá poniéndolas todas juntas sin espacios
  },
  tls: {
    rejectUnauthorized: false // Esto evita problemas si hay algún firewall en tu PC/Red
  }
});

// Esto te va a confirmar en la terminal si funcionó
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Sigue fallando:", error);
    } else {
        console.log("✅ ¡VICKA TURISMO ESTÁ LISTO PARA MANDAR MAILS!");
    }
});



module.exports = transporter;

