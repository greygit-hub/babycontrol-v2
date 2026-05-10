import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  if (!babyId) return NextResponse.json([], { status: 400 });
  const vacunas = await prisma.vacuna.findMany({
    where: { babyId },
    orderBy: { aplicadaEn: "asc" },
  });
  return NextResponse.json(vacunas);
}

export async function POST(req: NextRequest) {
  const { babyId, nombre, folio, aplicadaEn, clinica, lote } = await req.json();
  if (!babyId || !nombre) return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  const v = await prisma.vacuna.create({
    data: {
      babyId,
      nombre,
      ...(folio ? { folio } : {}),
      ...(aplicadaEn ? { aplicadaEn: new Date(aplicadaEn) } : {}),
      ...(clinica ? { clinica } : {}),
      ...(lote ? { lote } : {}),
    },
  });
  return NextResponse.json(v);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await prisma.vacuna.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
