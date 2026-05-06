import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    const token = signToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    res.cookies.set("token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch {
    return NextResponse.json({ error: "Error al iniciar sesion" }, { status: 500 });
  }
}
