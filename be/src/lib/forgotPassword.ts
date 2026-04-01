// src/lib/forgotPassword.ts
import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "./prisma";
import { sendPasswordResetEmail } from "./mailer";

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email, username } = req.body as {
      email?: string;
      username?: string | null;
    };

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.json({
        message:
          "If an account exists for this email, a reset link and code have been sent.",
      });
    }

    // optional username check
    if (username && username.trim()) {
      if (
        user.username &&
        user.username.toLowerCase() !== username.trim().toLowerCase()
      ) {
        return res.json({
          message:
            "If an account exists for this email, a reset link and code have been sent.",
        });
      }
    }

    // generate token + 6-digit code
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

   await prisma.passwordReset.deleteMany({
  where: { userId: user.id },
});

await prisma.passwordReset.create({
  data: {
    userId: user.id,
    tokenHash: hashedToken,
    codeHash: hashedCode,
    expiresAt,
    used: false,
  },
});


    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const resetLink = `${appBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      normalizedEmail
    )}`;

    // send to the email entered in the form
    await sendPasswordResetEmail(normalizedEmail, resetLink, resetCode);

    return res.json({
      message:
        "If an account exists for this email, a reset link and code have been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res
      .status(500)
      .json({ message: "Unable to process request. Please try again." });
  }
}
