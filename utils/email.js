const nodemailer = require("nodemailer");

const sendEmail = async (option) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PWD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL,
    to: option.email,
    subject: option.subject,
    html: option.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
