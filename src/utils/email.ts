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

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";

/** Kerangka HTML yang dipakai semua email keluar. */
const send = (
  to: string,
  subject: string,
  heading: string,
  intro: string,
  ctaLabel: string,
  link: string
) =>
  transporter.sendMail({
    from: `"Emobo Support" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0a4da0; text-align: center;">${heading}</h2>
        ${intro}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #0a4da0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">${ctaLabel}</a>
        </div>
        <p>Atau copy-paste link berikut ke browser kamu:</p>
        <p style="word-break: break-all; color: #666;">${link}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© 2026 Emobo Corporation. All rights reserved.</p>
      </div>
    `,
  });

export const sendVerificationEmail = async (email: string, token: string) =>
  send(
    email,
    "Konfirmasi Email",
    "Selamat Datang di Emobo!",
    "<p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi email kamu:</p>",
    "Verifikasi Email",
    `${frontendUrl()}/verify-email?token=${token}`
  );

export const sendPasswordResetEmail = async (email: string, token: string) =>
  send(
    email,
    "Reset Password Akun Emobo Kamu",
    "Halo dari Emobo!",
    `<p>Kami menerima permintaan untuk mereset password akun kamu. Jika kamu tidak merasa melakukan ini, abaikan saja email ini.</p>
     <p>Silakan klik tombol di bawah ini untuk mengatur ulang password kamu:</p>
     <p>Link ini hanya berlaku selama 1 jam.</p>`,
    "Reset Password",
    `${frontendUrl()}/reset-password?token=${token}`
  );
