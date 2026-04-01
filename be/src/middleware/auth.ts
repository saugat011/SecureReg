import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/security";

export type AuthedRequest = Request & { user?: { userId: string; username: string } };

export default function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) return res.status(401).json({ ok: false, message: "Missing token" });

  try {
    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId, username: decoded.username };
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}
