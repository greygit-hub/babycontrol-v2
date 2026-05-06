import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "babycontrol2026secretkey";

export function signToken(payload: { id: string; email: string; isAdmin: boolean }) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { id: string; email: string; isAdmin: boolean } | null {
  try {
    return jwt.verify(token, SECRET) as { id: string; email: string; isAdmin: boolean };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}
