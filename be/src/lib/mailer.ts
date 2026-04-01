import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "SecureReg password reset",
    text: `We received a request to reset your password.

Reset link: ${resetLink}
Verification code: ${code}

If you did not request this, you can ignore this email.`,
    html: `
      <p>We received a request to reset your SecureReg password.</p>
      <p><strong>Reset link:</strong><br/>
        <a href="${resetLink}">${resetLink}</a>
      </p>
      <p><strong>Verification code (2FA):</strong><br/>
        <span style="font-family: monospace; font-size: 18px;">${code}</span>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
}

async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "SecureReg - Verify your account",
    text: `Welcome to SecureReg!\n\nYour verification code is: ${code}\n\nEnter this code on the website to complete your registration.`,
    html: `
      <p>Welcome to <strong>SecureReg</strong>!</p>
      <p>Your verification code is: <span style="font-size: 18px; font-weight: bold; font-family: monospace;">${code}</span></p>
      <p>Enter this code on the website to complete your registration.</p>
    `,
  });
}

// Export as a single object to avoid TS caching issues
export const mailer = {
  sendPasswordResetEmail,
  sendVerificationEmail,
};