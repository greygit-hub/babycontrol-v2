import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  if (!babyId) return NextResponse.json([], { status: 400 });
  const tratamientos = await prisma.medicamentoTratamiento.findMany({
    where: { babyId },
    include: { administraciones: { orderBy: { administradoEn: "asc" } } },
    orderBy: { fechaInicio: "desc" },
  });
  return NextResponse.json(tratamientos);
}

export async function POST(req: NextRequest) {
  const { babyId, nombre, dosis, frecuenciaHoras, diasTotal, fechaInicio } = await req.json();
  if (!babyId || !nombre || !dosis || !frecuenciaHoras || !diasTotal || !fechaInicio) {
    return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  }
  const t = await prisma.medicamentoTratamiento.create({
    data: {
      babyId,
      nombre,
      dosis,
      frecuenciaHoras: parseInt(String(frecuenciaHoras)),
      diasTotal: parseInt(String(diasTotal)),
      fechaInicio: new Date(fechaInicio),
    },
    include: { administraciones: true },
  });
  return NextResponse.json(t);
}

export async function PATCH(req: NextRequest) {
  const { id, activo } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const t = await prisma.medicamentoTratamiento.update({
    where: { id },
    data: { activo },
    include: { administraciones: { orderBy: { administradoEn: "asc" } } },
  });
  return NextResponse.json(t);
}
