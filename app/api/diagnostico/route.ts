import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get("babyId");
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const baby = await prisma.baby.findUnique({ where: { id: babyId } });
  if (!baby) return NextResponse.json({ error: "Bebé no encontrado" }, { status: 404 });
  const ahora = new Date();
  const nacimiento = baby.birthDate ? new Date(baby.birthDate) : null;
  const edadDias = nacimiento ? Math.floor((ahora.getTime() - nacimiento.getTime()) / (1000 * 60 * 60 * 24)) : 30;
  const edadSemanas = Math.floor(edadDias / 7);
  const edadMeses = Math.floor(edadDias / 30);
  const pesoKg = baby.pesoKg ?? 3.5;
  let mlMinPorToma = 15, mlMaxPorToma = 30, tomasMinDia = 8, tomasMaxDia = 12;
  if (edadMeses >= 3) { mlMinPorToma = 120; mlMaxPorToma = 180; tomasMinDia = 5; tomasMaxDia = 6; }
  else if (edadMeses >= 2) { mlMinPorToma = 120; mlMaxPorToma = 150; tomasMinDia = 6; tomasMaxDia = 7; }
  else if (edadMeses >= 1) { mlMinPorToma = 90; mlMaxPorToma = 120; tomasMinDia = 7; tomasMaxDia = 8; }
  const mlRecomendadosDia = Math.round(pesoKg * 150);
  const pipiMinimo = edadDias <= 5 ? edadDias : 6;
  const edadTexto = edadDias < 7 ? edadDias + " días" : edadSemanas < 8 ? edadSemanas + " semana(s)" : edadMeses + " mes(es) y " + Math.floor((edadDias % 30) / 7) + " semana(s)";

  // Usar rango local enviado por el cliente si existe
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const inicio = startParam ? new Date(startParam) : new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
  const fin = endParam ? new Date(endParam) : new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

  const records = await prisma.record.findMany({ where: { babyId, recordedAt: { gte: inicio, lte: fin } } });
  const totalFormula = records.filter(r => r.type === "FORMULA").reduce((s, r) => s + (r.formulaMl ?? 0), 0);
  const tomasFormula = records.filter(r => r.type === "FORMULA").length;
  const tomasPecho = records.filter(r => r.type === "PECHO").length;
  const pipi = records.filter(r => r.type === "PANAL_PIPI").length;
  const popo = records.filter(r => r.type === "PANAL_POPO").length;
  const sueno = records.filter(r => r.type === "SUENO").reduce((s, r) => s + (r.pechoMin ?? 0), 0);
  const meds = records.filter(r => r.type === "MEDICAMENTO");
  const supls = records.filter(r => r.type === "SUPLEMENTO");
  const totalTomas = tomasFormula + tomasPecho;
  const alertas: string[] = [], positivos: string[] = [], alertasCriticas: string[] = [];

  if (totalTomas > 0 && totalTomas < tomasMinDia - 2) alertas.push("Pocas tomas hoy (" + totalTomas + "). Se recomiendan " + tomasMinDia + "-" + tomasMaxDia + " tomas.");
  else if (totalTomas >= tomasMinDia) positivos.push("Número de tomas correcto: " + totalTomas + " tomas.");
  if (totalFormula > 0 && totalFormula < mlRecomendadosDia * 0.7) alertas.push("Ha tomado " + totalFormula + " ml. Meta: " + mlRecomendadosDia + " ml/día.");
  else if (totalFormula >= mlRecomendadosDia * 0.9) positivos.push("Consumo adecuado: " + totalFormula + " ml.");
  else if (totalFormula > 0) positivos.push("Va bien: " + totalFormula + " ml. Meta: " + mlRecomendadosDia + " ml.");
  if (pipi === 0 && totalTomas > 0) alertasCriticas.push("Sin pañales mojados hoy. Si pasan 12-24h sin orinar consulta al pediatra.");
  else if (pipi < pipiMinimo && totalTomas > 0) alertas.push("Pocos pañales mojados (" + pipi + "). Lo normal son " + pipiMinimo + " o más.");
  else if (pipi >= pipiMinimo) positivos.push("Buena hidratación: " + pipi + " pañales mojados.");
  if (popo === 0 && edadMeses < 1) alertas.push("Sin deposición hoy. En recién nacidos es normal defecar varias veces.");
  else if (popo > 0) positivos.push("Deposición registrada: " + popo + " vez(ces).");
  if (sueno > 0 && sueno < 120) alertas.push("Solo " + sueno + " min de sueño. Los bebés necesitan 14-17 horas diarias.");
  else if (sueno >= 120) positivos.push("Buen descanso: " + sueno + " min de sueño.");
  if (meds.length > 0) positivos.push("Medicamento(s) registrado(s): " + meds.map(m => m.notes ?? "sin nombre").join(", ") + ".");
  if (supls.length > 0) positivos.push("Suplemento(s) registrado(s): " + supls.map(s => s.notes ?? "sin nombre").join(", ") + ".");
  if (!alertas.length && !positivos.length && !alertasCriticas.length) positivos.push("Registra más actividades para un diagnóstico completo.");

  return NextResponse.json({ bebe: { pesoKg, edadTexto, mlRecomendadosDia, mlMinPorToma, mlMaxPorToma, tomasMinDia, tomasMaxDia, pipiMinimo }, alertasCriticas, alertas, positivos });
}
