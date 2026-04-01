import { Router, RequestHandler } from "express"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { mailer } from "../lib/mailer"; 
import rateLimit from "express-rate-limit";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";

function signToken(payload: { userId: string; username: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ------------------------------------------------------------------
// ADVANCED POLICY 1: Supercharged Password Complexity Checker
// ------------------------------------------------------------------
function validatePasswordComplexity(password: string, username?: string, email?: string): string | null {
  // 1. Min / Max Length
  if (password.length < 12) return "Password must be at least 12 characters long.";
  if (password.length > 64) return "Password must be less than 64 characters."; // Prevents bcrypt DoS attacks

  // 2. Character Classes
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character.";

  // 3. No Repeating Characters (e.g., "aaa" or "111")
  if (/(.)\1{2,}/.test(password)) return "Password cannot contain 3 or more repeating characters in a row.";

  // 4. Context-Specific Rules (No username/email inclusion)
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    return "Password cannot contain your username.";
  }
  
  if (email) {
    const emailPrefix = email.split("@")[0].toLowerCase();
    // Only check if the prefix is at least 4 chars to prevent false positives on short names
    if (emailPrefix.length >= 4 && password.toLowerCase().includes(emailPrefix)) {
      return "Password cannot contain your email address.";
    }
  }

  return null; // Passed all checks!
}

// Initialize the Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: "Too many attempts, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
}) as RequestHandler; 


// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return res.status(400).send("username, email and password required");
    }

    // Apply Advanced Complexity Policy (Pass username and email for context checks)
    const complexityError = validatePasswordComplexity(password, username, email);
    if (complexityError) {
      return res.status(400).send(complexityError);
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: normalizedEmail }] },
    });

    if (existingUser) {
      return res.status(409).send("Username or email already exists");
    }

    const hash = await bcrypt.hash(password, 10);
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash("sha256").update(rawCode).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await prisma.pendingUser.upsert({
      where: { email: normalizedEmail },
      update: {
        username,
        passwordHash: hash,
        codeHash,
        expiresAt,
      },
      create: {
        username,
        email: normalizedEmail,
        passwordHash: hash,
        codeHash,
        expiresAt,
      },
    });

    await mailer.sendVerificationEmail(normalizedEmail, rawCode);

    return res.status(201).json({ message: "Verification code sent." });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).send("Internal server error");
  }
});


// POST /auth/verify-registration
router.post("/verify-registration", authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).send("Email and code required");

    const normalizedEmail = email.toLowerCase();

    const pendingUser = await prisma.pendingUser.findUnique({ 
      where: { email: normalizedEmail } 
    });

    if (!pendingUser) {
      return res.status(400).send("No pending registration found for this email.");
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    if (pendingUser.codeHash !== codeHash || pendingUser.expiresAt < new Date()) {
      return res.status(400).send("Invalid or expired verification code.");
    }

    const newUser = await prisma.user.create({
      data: {
        username: pendingUser.username,
        email: pendingUser.email,
        passwordHash: pendingUser.passwordHash,
        passwordChangedAt: new Date(), 
      },
    });

    await prisma.pendingUser.delete({
      where: { id: pendingUser.id },
    });

    const token = signToken({ userId: newUser.id, username: newUser.username });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ id: newUser.id, username: newUser.username, message: "Account created and verified!" });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).send("Internal server error");
  }
});


// POST /auth/login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).send("email and password required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).send("Invalid credentials");
    }

    // ------------------------------------------------------------------
    // ADVANCED POLICY 2: Frequency of Change (90 Days)
    // ------------------------------------------------------------------
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const lastChanged = user.passwordChangedAt || new Date(0); 

    if (lastChanged < ninetyDaysAgo) {
      return res.status(403).send("Your password has expired (older than 90 days). Please use the 'Forgot Password' link to reset it.");
    }

    const token = signToken({ userId: user.id, username: user.username });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Internal server error");
  }
});


// POST /auth/forgot-password
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email, username } = req.body as {
      email?: string;
      username?: string | null;
    };

    if (!email || !email.trim()) {
      return res.status(400).send("email required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const message = "If an account exists for this email, a reset link and verification code have been sent.";

    if (!user) return res.json({ message });

    if (username && username.trim()) {
      if (user.username && user.username.toLowerCase() !== username.trim().toLowerCase()) {
        return res.json({ message });
      }
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString(); 
    const codeHash = crypto.createHash("sha256").update(rawCode).digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordReset.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
        codeHash,
        used: false,
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const resetLink = `${appBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await mailer.sendPasswordResetEmail(normalizedEmail, resetLink, rawCode);

    return res.json({ message });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).send("Internal server error");
  }
});


// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, code, newPassword } = req.body as {
      token?: string;
      code?: string;
      newPassword?: string;
    };

    if (!token || !code || !newPassword) {
      return res.status(400).send("token, code and newPassword are required");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    // Fetch user and history first to pass username/email to complexity checker
    const reset = await prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        codeHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { 
        user: { 
          include: { passwordHistory: { orderBy: { createdAt: 'desc' }, take: 3 } } 
        } 
      },
    });

    if (!reset) return res.status(400).send("Invalid or expired reset request");
    
    const user = reset.user;

    // Apply Advanced Complexity Policy
    const complexityError = validatePasswordComplexity(newPassword, user.username, user.email);
    if (complexityError) {
      return res.status(400).send(complexityError);
    }

    // ------------------------------------------------------------------
    // ADVANCED POLICY 3: Prevent Password Repetition
    // ------------------------------------------------------------------
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsCurrent) {
      return res.status(400).send("New password cannot be the same as your current password.");
    }

    for (const history of user.passwordHistory) {
      const isReused = await bcrypt.compare(newPassword, history.passwordHash);
      if (isReused) {
         return res.status(400).send("You cannot reuse any of your last 3 passwords.");
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.passwordHistory.create({
        data: { passwordHash: user.passwordHash, userId: user.id }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: hash,
          passwordChangedAt: new Date() 
        },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      })
    ]);

    return res.send("Password reset successful. You can now log in.");
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).send("Internal server error");
  }
});


// POST /auth/change-password
router.post("/change-password", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send("Not logged in");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).send("Current and new password are required");
    }

    // Fetch user and their last 3 passwords FIRST
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { passwordHistory: { orderBy: { createdAt: 'desc' }, take: 3 } }
    });

    if (!user) return res.status(401).send("User not found");

    // Apply Advanced Complexity Policy
    const complexityError = validatePasswordComplexity(newPassword, user.username, user.email);
    if (complexityError) {
      return res.status(400).send(complexityError);
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).send("Incorrect current password");

    // ------------------------------------------------------------------
    // ADVANCED POLICY 3: Prevent Password Repetition
    // ------------------------------------------------------------------
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsCurrent) {
      return res.status(400).send("New password cannot be the same as your current password.");
    }

    for (const history of user.passwordHistory) {
      const isReused = await bcrypt.compare(newPassword, history.passwordHash);
      if (isReused) {
         return res.status(400).send("You cannot reuse any of your last 3 passwords.");
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.$transaction([
      prisma.passwordHistory.create({
        data: { passwordHash: user.passwordHash, userId: user.id }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: newHash,
          passwordChangedAt: new Date() 
        },
      })
    ]);

    return res.send("Password successfully changed.");
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).send("Internal server error");
  }
});


// GET /auth/me
router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send("Not logged in");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) return res.status(401).send("Not logged in");

    return res.json(user);
  } catch {
    return res.status(401).send("Invalid token");
  }
});


// POST /auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.sendStatus(204);
});

export default router;