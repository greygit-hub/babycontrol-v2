import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const babyId = new URL(req.url).searchParams.get("babyId");
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const baby = await prisma.baby.findUnique({ where: { id: babyId } });
  if (!baby) return NextResponse.json({ error: "Bebe no encontrado" }, { status: 404 });
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
  let edadTexto = edadDias < 7 ? edadDias + " dias" : edadSemanas < 8 ? edadSemanas + " semanas" : edadMeses + " meses";
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
  const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
  const records = await prisma.record.findMany({ where: { babyId, recordedAt: { gte: inicio, lte: fin } } });
  const totalFormula = records.filter(r => r.type === "FORMULA").reduce((s, r) => s + (r.formulaMl ?? 0), 0);
  const tomasFormula = records.filter(r => r.type === "FORMULA").length;
  const tomasPecho = records.filter(r => r.type === "PECHO").length;
  const pipi = records.filter(r => r.type === "PANAL_PIPI").length;
  const totalTomas = tomasFormula + tomasPecho;
  const alertas: string[] = [], positivos: string[] = [], alertasCriticas: string[] = [];
  if (totalTomas > 0 && totalTomas < tomasMinDia - 2) alertas.push("Pocas tomas hoy (" + totalTomas + "). Se recomiendan " + tomasMinDia + "-" + tomasMaxDia + " tomas al dia.");
  else if (totalTomas >= tomasMinDia) positivos.push("Numero de tomas correcto: " + totalTomas + " tomas.");
  if (totalFormula > 0 && totalFormula < mlRecomendadosDia * 0.7) alertas.push("Ha tomado " + totalFormula + " ml. Para su peso (" + pesoKg + " kg) se recomiendan " + mlRecomendadosDia + " ml/dia.");
  else if (totalFormula >= mlRecomendadosDia * 0.9) positivos.push("Consumo adecuado: " + totalFormula + " ml de " + mlRecomendadosDia + " ml.");
  else if (totalFormula > 0) positivos.push("Va bien: " + totalFormula + " ml. Meta: " + mlRecomendadosDia + " ml.");
  if (pipi === 0 && totalTomas > 0) alertasCriticas.push("Sin panales mojados hoy. Si pasan 12-24h sin orinar consulta al pediatra.");
  else if (pipi < pipiMinimo && totalTomas > 0) alertas.push("Pocos panales mojados (" + pipi + "). Lo normal son " + pipiMinimo + " o mas.");
  else if (pipi >= pipiMinimo) positivos.push("Panales mojados correctos: " + pipi + " hoy.");
  return NextResponse.json({
    bebe: { pesoKg, edadTexto, mlRecomendadosDia, mlMinPorToma, mlMaxPorToma, tomasMinDia, tomasMaxDia, pipiMinimo },
    alertasCriticas, alertas, positivos,
  });
}
