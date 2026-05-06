import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, name: true, email: true, isAdmin: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json(user);
}
