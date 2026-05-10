import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const babyId = new URL(req.url).searchParams.get("babyId");
  if (!babyId) return NextResponse.json([], { status: 400 });
  const data = await prisma.diagnosticoHistorial.findMany({
    where: { babyId },
    orderBy: { fecha: "desc" },
    take: 30,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { babyId, fecha, alertasCriticas, alertas, positivos } = await req.json();
  if (!babyId || !fecha) return NextResponse.json({ error: "Requerido" }, { status: 400 });
  const record = await prisma.diagnosticoHistorial.upsert({
    where: { babyId_fecha: { babyId, fecha } },
    update: { alertasCriticas, alertas, positivos },
    create: { babyId, fecha, alertasCriticas: alertasCriticas ?? [], alertas: alertas ?? [], positivos: positivos ?? [] },
  });
  return NextResponse.json(record);
}
