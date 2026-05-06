import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const babyId = new URL(req.url).searchParams.get("babyId");
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const baby = await prisma.baby.findUnique({ where: { id: babyId } });
  return NextResponse.json(baby);
}

export async function PUT(req: NextRequest) {
  const { babyId, fotoUrl, pesoKg, birthDate } = await req.json();
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (fotoUrl !== undefined) data.fotoUrl = fotoUrl;
  if (pesoKg !== undefined) data.pesoKg = parseFloat(pesoKg);
  if (birthDate !== undefined) data.birthDate = new Date(birthDate);
  const baby = await prisma.baby.update({ where: { id: babyId }, data });
  return NextResponse.json(baby);
}
