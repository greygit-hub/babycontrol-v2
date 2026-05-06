import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  const periodo = searchParams.get("periodo") ?? "semana";
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setDate(ahora.getDate() - (periodo === "mes" ? 30 : 7));
  const records = await prisma.record.findMany({ where: { babyId, recordedAt: { gte: inicio } }, orderBy: { recordedAt: "asc" } });
  const dias: Record<string, { formula: number; tomas: number; pipi: number; popo: number; sueno: number }> = {};
  records.forEach(r => {
    const dia = new Date(r.recordedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    if (!dias[dia]) dias[dia] = { formula: 0, tomas: 0, pipi: 0, popo: 0, sueno: 0 };
    if (r.type === "FORMULA") { dias[dia].formula += r.formulaMl ?? 0; dias[dia].tomas++; }
    if (r.type === "PECHO") dias[dia].tomas++;
    if (r.type === "PANAL_PIPI") dias[dia].pipi++;
    if (r.type === "PANAL_POPO") dias[dia].popo++;
    if (r.type === "SUENO") dias[dia].sueno += r.pechoMin ?? 0;
  });
  const vals = Object.values(dias);
  const n = Math.max(vals.length, 1);
  const promedios = { formula: Math.round(vals.reduce((s,d)=>s+d.formula,0)/n), tomas: Math.round(vals.reduce((s,d)=>s+d.tomas,0)/n*10)/10, pipi: Math.round(vals.reduce((s,d)=>s+d.pipi,0)/n*10)/10, popo: Math.round(vals.reduce((s,d)=>s+d.popo,0)/n*10)/10, sueno: Math.round(vals.reduce((s,d)=>s+d.sueno,0)/n) };
  return NextResponse.json({ periodo, dias: Object.entries(dias).map(([fecha,data])=>({fecha,...data})), promedios, totalRegistros: records.length });
}
