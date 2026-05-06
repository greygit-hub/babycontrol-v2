import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  const fecha = searchParams.get("fecha");
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const where: Record<string, unknown> = { babyId };
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (start && end) {
    where.recordedAt = { gte: new Date(start), lte: new Date(end) };
  } else if (fecha) {
    where.recordedAt = { gte: new Date(fecha + "T00:00:00.000Z"), lte: new Date(fecha + "T23:59:59.999Z") };
  }
  const records = await prisma.record.findMany({ where, orderBy: { recordedAt: "desc" } });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  try {
    const { babyId, type, recordedAt, formulaMl, pechoMin, notes } = await req.json();
    const record = await prisma.record.create({ data: { babyId, type, recordedAt: recordedAt ? new Date(recordedAt) : new Date(), formulaMl: formulaMl ?? null, pechoMin: pechoMin ?? null, notes: notes ?? null } });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    console.error("Error guardando registro:", e);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
