import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const babies = await prisma.baby.findMany({ where: { userId: payload.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(babies);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { name, birthDate, pesoKg } = await req.json();
  const baby = await prisma.baby.create({ data: { name, birthDate: birthDate ? new Date(birthDate) : null, pesoKg: pesoKg ? parseFloat(pesoKg) : null, userId: payload.id } });
  return NextResponse.json(baby, { status: 201 });
}
