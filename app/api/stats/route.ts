import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  const periodo = searchParams.get("periodo") ?? "semana";
  const tz = searchParams.get("tz") ?? "America/Mexico_City";
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setDate(ahora.getDate() - (periodo === "mes" ? 30 : 7));
  const records = await prisma.record.findMany({ where: { babyId, recordedAt: { gte: inicio } }, orderBy: { recordedAt: "asc" } });
  type DiaData = { formula: number; tomas: number; pipi: number; popo: number; sueno: number; medicamentos: number; suplementos: number };
  const dias: Record<string, DiaData> = {};
  records.forEach(r => {
    const dia = new Date(r.recordedAt).toLocaleDateString("es-MX", { timeZone: tz, day: "numeric", month: "short" });
    if (!dias[dia]) dias[dia] = { formula: 0, tomas: 0, pipi: 0, popo: 0, sueno: 0, medicamentos: 0, suplementos: 0 };
    if (r.type === "FORMULA") { dias[dia].formula += r.formulaMl ?? 0; dias[dia].tomas++; }
    if (r.type === "PECHO") dias[dia].tomas++;
    if (r.type === "PANAL_PIPI") dias[dia].pipi++;
    if (r.type === "PANAL_POPO") dias[dia].popo++;
    if (r.type === "SUENO") dias[dia].sueno += r.pechoMin ?? 0;
    if (r.type === "MEDICAMENTO") dias[dia].medicamentos++;
    if (r.type === "SUPLEMENTO") dias[dia].suplementos++;
  });
  const vals = Object.values(dias);
  const n = Math.max(vals.length, 1);
  const rd = (v: number) => Math.round(v * 10) / 10;
  const promedios = {
    formula: Math.round(vals.reduce((s, d) => s + d.formula, 0) / n),
    tomas: rd(vals.reduce((s, d) => s + d.tomas, 0) / n),
    pipi: rd(vals.reduce((s, d) => s + d.pipi, 0) / n),
    popo: rd(vals.reduce((s, d) => s + d.popo, 0) / n),
    sueno: Math.round(vals.reduce((s, d) => s + d.sueno, 0) / n),
    medicamentos: rd(vals.reduce((s, d) => s + d.medicamentos, 0) / n),
    suplementos: rd(vals.reduce((s, d) => s + d.suplementos, 0) / n),
  };
  return NextResponse.json({ periodo, dias: Object.entries(dias).map(([fecha, data]) => ({ fecha, ...data })), promedios, totalRegistros: records.length });
}
