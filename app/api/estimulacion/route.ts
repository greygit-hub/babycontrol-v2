import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const babyId = url.searchParams.get("babyId");
  const fecha = url.searchParams.get("fecha");
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!babyId) return NextResponse.json([], { status: 400 });

  if (start && end) {
    const startDate = start.slice(0, 10);
    const endDate = end.slice(0, 10);
    const [checks, notas] = await Promise.all([
      prisma.estimulacionCheck.findMany({ where: { babyId, fecha: { gte: startDate, lte: endDate } }, orderBy: { fecha: "asc" } }),
      prisma.estimulacionNota.findMany({ where: { babyId, fecha: { gte: startDate, lte: endDate } } }),
    ]);
    const result: Record<string, { checks: string[]; nota: string | null }> = {};
    checks.forEach(c => {
      if (!result[c.fecha]) result[c.fecha] = { checks: [], nota: null };
      result[c.fecha].checks.push(c.actividad);
    });
    notas.forEach(n => {
      if (!result[n.fecha]) result[n.fecha] = { checks: [], nota: null };
      result[n.fecha].nota = n.nota;
    });
    return NextResponse.json(result);
  }

  if (!fecha) return NextResponse.json([], { status: 400 });
  const checks = await prisma.estimulacionCheck.findMany({ where: { babyId, fecha } });
  return NextResponse.json(checks.map(c => c.actividad));
}

export async function POST(req: NextRequest) {
  const { babyId, fecha, actividad } = await req.json();
  if (!babyId || !fecha || !actividad) return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  const existing = await prisma.estimulacionCheck.findUnique({
    where: { babyId_fecha_actividad: { babyId, fecha, actividad } },
  });
  if (existing) {
    await prisma.estimulacionCheck.delete({ where: { id: existing.id } });
    return NextResponse.json({ checked: false });
  }
  await prisma.estimulacionCheck.create({ data: { babyId, fecha, actividad } });
  return NextResponse.json({ checked: true });
}
