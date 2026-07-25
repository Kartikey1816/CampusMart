const nodemailer = require('nodemailer');

const getVerificationUrl = (token) =>
  `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

const sendVerificationEmail = async ({ email, name, token }) => {
  const verificationUrl = getVerificationUrl(token);

  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
    return { developmentVerificationUrl: verificationUrl, developmentVerificationToken: token };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.EMAIL_FROM) {
    throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, and EMAIL_FROM.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your College Marketplace account',
    text: `Hi ${name}, verify your college email: ${verificationUrl}`,
    html: `<p>Hi ${name},</p><p>Verify your college email to activate your College Marketplace account.</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in one hour.</p>`
  });

  return {};
};

module.exports = { getVerificationUrl, sendVerificationEmail };
