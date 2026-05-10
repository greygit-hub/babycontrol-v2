import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function horaLocal(date: Date, tz: string): number {
  const str = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(date);
  return parseInt(str, 10);
}

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
  type DiaData = { panales: number; formula: number; tomas: number; pechoTomas: number; formulaTomas: number; pipi: number; popo: number; sueno: number; suenoDay: number; suenoNight: number; suenoDespierto: number; medicamentos: number; suplementos: number };
  const dias: Record<string, DiaData> = {};
  const panalTimes: Record<string, Set<string>> = {};
  records.forEach(r => {
    const dia = new Date(r.recordedAt).toLocaleDateString("es-MX", { timeZone: tz, day: "numeric", month: "short" });
    if (!dias[dia]) dias[dia] = { panales: 0, formula: 0, tomas: 0, pechoTomas: 0, formulaTomas: 0, pipi: 0, popo: 0, sueno: 0, suenoDay: 0, suenoNight: 0, suenoDespierto: 0, medicamentos: 0, suplementos: 0 };
    if (r.type === "FORMULA") { dias[dia].formula += r.formulaMl ?? 0; dias[dia].tomas++; dias[dia].formulaTomas++; }
    if (r.type === "PECHO") { dias[dia].tomas++; dias[dia].pechoTomas++; }
    if (r.type === "PANAL_PIPI") {
      dias[dia].pipi++;
      if (!panalTimes[dia]) panalTimes[dia] = new Set();
      panalTimes[dia].add(new Date(r.recordedAt).toISOString().slice(0, 16));
    }
    if (r.type === "PANAL_POPO") {
      dias[dia].popo++;
      if (!panalTimes[dia]) panalTimes[dia] = new Set();
      panalTimes[dia].add(new Date(r.recordedAt).toISOString().slice(0, 16));
    }
    if (r.type === "SUENO") {
      const min = r.pechoMin ?? 0;
      dias[dia].sueno += min;
      const hora = horaLocal(new Date(r.recordedAt), tz);
      if (hora >= 6 && hora < 22) {
        dias[dia].suenoDay += min;
      } else {
        dias[dia].suenoNight += min;
      }
    }
    if (r.type === "MEDICAMENTO") dias[dia].medicamentos++;
    if (r.type === "SUPLEMENTO") dias[dia].suplementos++;
  });
  Object.entries(panalTimes).forEach(([dia, times]) => { if (dias[dia]) dias[dia].panales = times.size; });
  // Cap daily sleep at 1440 min (overlapping records can exceed 24h), then compute awake
  Object.values(dias).forEach(d => {
    if (d.sueno > 1440) {
      const ratio = 1440 / d.sueno;
      d.suenoDay = Math.round(d.suenoDay * ratio);
      d.suenoNight = 1440 - d.suenoDay;
      d.sueno = 1440;
    }
    if (d.sueno > 0) d.suenoDespierto = Math.max(0, 1440 - d.sueno);
  });
  const vals = Object.values(dias);
  const n = Math.max(vals.length, 1);
  const rd = (v: number) => Math.round(v * 10) / 10;
  const promedios = {
    panales: rd(vals.reduce((s, d) => s + d.panales, 0) / n),
    formula: Math.round(vals.reduce((s, d) => s + d.formula, 0) / n),
    tomas: rd(vals.reduce((s, d) => s + d.tomas, 0) / n),
    pechoTomas: rd(vals.reduce((s, d) => s + d.pechoTomas, 0) / n),
    formulaTomas: rd(vals.reduce((s, d) => s + d.formulaTomas, 0) / n),
    pipi: rd(vals.reduce((s, d) => s + d.pipi, 0) / n),
    popo: rd(vals.reduce((s, d) => s + d.popo, 0) / n),
    sueno: Math.round(vals.reduce((s, d) => s + d.sueno, 0) / n),
    suenoDay: Math.round(vals.reduce((s, d) => s + d.suenoDay, 0) / n),
    suenoNight: Math.round(vals.reduce((s, d) => s + d.suenoNight, 0) / n),
    suenoDespierto: Math.round(vals.filter(d => d.sueno > 0).reduce((s, d) => s + d.suenoDespierto, 0) / Math.max(vals.filter(d => d.sueno > 0).length, 1)),
    medicamentos: rd(vals.reduce((s, d) => s + d.medicamentos, 0) / n),
    suplementos: rd(vals.reduce((s, d) => s + d.suplementos, 0) / n),
  };
  return NextResponse.json({ periodo, dias: Object.entries(dias).map(([fecha, data]) => ({ fecha, ...data })), promedios, totalRegistros: records.length });
}
