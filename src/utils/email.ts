import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Emobo Support" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Konfirmasi Email",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0a4da0; text-align: center;">Selamat Datang di Emobo!</h2>
        <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi email kamu:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #0a4da0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verifikasi Email</a>
        </div>
        <p>Atau copy-paste link berikut ke browser kamu:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© 2026 Emobo Corporation. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Emobo Support" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Password Akun Emobo Kamu",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0a4da0; text-align: center;">Halo dari Emobo!</h2>
        <p>Kami menerima permintaan untuk mereset password akun kamu. Jika kamu tidak merasa melakukan ini, abaikan saja email ini.</p>
        <p>Silakan klik tombol di bawah ini untuk mengatur ulang password kamu:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0a4da0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Link ini hanya berlaku selama 1 jam.</p>
        <p>Atau copy-paste link berikut ke browser kamu:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© 2026 Emobo Corporation. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
