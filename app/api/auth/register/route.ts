import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 400 });
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hash } });
    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
