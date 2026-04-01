import bcrypt from "bcryptjs";
import * as _jsonwebtoken from "jsonwebtoken";

const jwt: any = (_jsonwebtoken as any).default ?? (_jsonwebtoken as any);

export type TokenPayload = { userId: string; username: string };

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

const JWT_SECRET = requiredEnv("JWT_SECRET");

export async function hashPassword(password: string, rounds = Number(process.env.BCRYPT_ROUNDS ?? 12)) {
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded !== "object" || decoded === null) throw new Error("Invalid token payload");

  const obj = decoded as any;
  if (typeof obj.userId !== "string" || typeof obj.username !== "string") {
    throw new Error("Invalid token payload");
  }

  return { userId: obj.userId, username: obj.username };
}
