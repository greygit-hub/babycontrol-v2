import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const babyId = url.searchParams.get("babyId");
  const fecha = url.searchParams.get("fecha");
  if (!babyId || !fecha) return NextResponse.json({ nota: null });
  const row = await prisma.estimulacionNota.findUnique({ where: { babyId_fecha: { babyId, fecha } } });
  return NextResponse.json({ nota: row?.nota ?? null });
}

export async function PUT(req: NextRequest) {
  const { babyId, fecha, nota } = await req.json();
  if (!babyId || !fecha) return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  const row = await prisma.estimulacionNota.upsert({
    where: { babyId_fecha: { babyId, fecha } },
    update: { nota: nota ?? "" },
    create: { babyId, fecha, nota: nota ?? "" },
  });
  return NextResponse.json({ nota: row.nota });
}
