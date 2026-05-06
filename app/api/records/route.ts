import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  const fecha = searchParams.get("fecha");
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const where: Record<string, unknown> = { babyId };
  if (fecha) {
    where.recordedAt = { gte: new Date(fecha + "T00:00:00.000Z"), lte: new Date(fecha + "T23:59:59.999Z") };
  } else {
    const hoy = new Date();
    where.recordedAt = { gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0), lte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59) };
  }
  const records = await prisma.record.findMany({ where, orderBy: { recordedAt: "desc" } });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const { babyId, type, recordedAt, formulaMl, pechoMin, notes } = await req.json();
  const record = await prisma.record.create({ data: { babyId, type, recordedAt: recordedAt ? new Date(recordedAt) : new Date(), formulaMl, pechoMin, notes } });
  return NextResponse.json(record, { status: 201 });
}
