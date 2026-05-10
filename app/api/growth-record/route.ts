import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const babyId = new URL(req.url).searchParams.get("babyId");
  if (!babyId) return NextResponse.json([], { status: 400 });
  const records = await prisma.growthRecord.findMany({
    where: { babyId },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const { babyId, pesoKg, estaturaCmd, fecha } = await req.json();
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const record = await prisma.growthRecord.create({
    data: {
      babyId,
      ...(pesoKg !== undefined && pesoKg !== null && pesoKg !== "" ? { pesoKg: parseFloat(pesoKg) } : {}),
      ...(estaturaCmd !== undefined && estaturaCmd !== null && estaturaCmd !== "" ? { estaturaCmd: parseFloat(estaturaCmd) } : {}),
      ...(fecha ? { fecha: new Date(fecha) } : {}),
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await prisma.growthRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
