import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getActividadTexto, getRecomendacionPanal } from "@/lib/guias";

const TIPO_LABEL: Record<string, string> = {
  FORMULA: "Fórmula", PECHO: "Pecho", PANAL_PIPI: "Pañal Pipí",
  PANAL_POPO: "Pañal Popó", SUENO: "Sueño", PESO: "Peso",
  TEMPERATURA: "Temperatura", MEDICAMENTO: "Medicamento", SUPLEMENTO: "Suplemento",
};

const PURPLE = "FF6D28D9";
const EMERALD = "FF059669";
const SKY = "FF0284C7";
const PURPLE_LIGHT = "FFF5F3FF";
const WHITE = "FFFFFFFF";
const GRAY_LIGHT = "FFF8FAFC";
const HEADER_FONT = { bold: true, color: { argb: WHITE }, size: 11 } as const;
const CELL_FONT = { size: 10 } as const;

function headerRow(ws: ExcelJS.Worksheet, cols: string[], color: string) {
  const row = ws.addRow(cols);
  row.height = 22;
  row.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
  });
  row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  return row;
}

function dataRow(ws: ExcelJS.Worksheet, vals: (string | number)[], isEven: boolean) {
  const row = ws.addRow(vals);
  row.height = 18;
  row.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? WHITE : GRAY_LIGHT } };
    cell.font = CELL_FONT;
    cell.alignment = { vertical: "middle", wrapText: false };
    cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
  });
  return row;
}

function sectionTitle(ws: ExcelJS.Worksheet, title: string, span: number) {
  ws.addRow([]);
  const row = ws.addRow([title]);
  row.height = 20;
  row.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E293B" } };
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE_LIGHT } };
  ws.mergeCells(row.number, 1, row.number, span);
  row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  return row;
}

function infoRow(ws: ExcelJS.Worksheet, label: string, value: string | number, span: number) {
  const row = ws.addRow([label, value]);
  row.height = 18;
  row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF6D28D9" } };
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE_LIGHT } };
  row.getCell(2).font = { size: 10 };
  row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE_LIGHT } };
  ws.mergeCells(row.number, 2, row.number, span);
  return row;
}

function calcEdad(birthDate: Date): string {
  const meses = Math.floor((Date.now() - birthDate.getTime()) / (30.44 * 86400000));
  const años = Math.floor(meses / 12);
  if (años >= 1) return `${años} año${años > 1 ? "s" : ""}`;
  if (meses >= 1) return `${meses} mes${meses !== 1 ? "es" : ""}`;
  const dias = Math.floor((Date.now() - birthDate.getTime()) / 86400000);
  return `${dias} día${dias !== 1 ? "s" : ""}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const babyId = url.searchParams.get("babyId");
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!babyId || !start || !end) return NextResponse.json({ error: "Parámetros requeridos" }, { status: 400 });

  const startDate = start.slice(0, 10);
  const endDate = end.slice(0, 10);

  const [baby, records, checks, notas] = await Promise.all([
    prisma.baby.findUnique({ where: { id: babyId } }),
    prisma.record.findMany({
      where: { babyId, recordedAt: { gte: new Date(start), lte: new Date(end) } },
      orderBy: { recordedAt: "asc" },
    }),
    prisma.estimulacionCheck.findMany({
      where: { babyId, fecha: { gte: startDate, lte: endDate } },
      orderBy: { fecha: "asc" },
    }),
    prisma.estimulacionNota.findMany({
      where: { babyId, fecha: { gte: startDate, lte: endDate } },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "BabyControl";
  wb.created = new Date();

  const fechaGenerado = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const birthDate = baby?.birthDate ? new Date(baby.birthDate) : null;
  const mesesEdad = birthDate
    ? (() => { const now = new Date(); let m = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth()); if (now.getDate() < birthDate.getDate()) m--; return Math.max(0, m); })()
    : 0;
  const recPanal = getRecomendacionPanal(mesesEdad, baby?.pesoKg ?? null);

  // Imágenes
  const logoPath = join(process.cwd(), "public", "logo-babycontrol.png");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logoId = existsSync(logoPath)
    ? wb.addImage({ buffer: readFileSync(logoPath) as any, extension: "png" })
    : null;

  let fotoId: number | null = null;
  if (baby?.fotoUrl) {
    try {
      const res = await fetch(baby.fotoUrl);
      if (res.ok) {
        const ext = baby.fotoUrl.toLowerCase().includes(".png") ? "png" : "jpeg";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fotoId = wb.addImage({ buffer: Buffer.from(await res.arrayBuffer()) as any, extension: ext });
      }
    } catch { /* foto no disponible, se omite */ }
  }

  // ── Sheet 1: Resumen ──────────────────────────────────────────────
  const ws1 = wb.addWorksheet("Resumen");
  ws1.columns = [{ width: 28 }, { width: 32 }, { width: 18 }, { width: 18 }];

  // Encabezado BabyControl (fila alta para el logo)
  const titleRow = ws1.addRow(["   BabyControl — Reporte de salud y cuidado"]);
  titleRow.height = 56;
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: WHITE } };
  titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
  titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  ws1.mergeCells(1, 1, 1, 4);
  if (logoId !== null) {
    ws1.addImage(logoId, { tl: { col: 0.1, row: 0.1 } as any, ext: { width: 48, height: 48 } });
  }

  const subRow = ws1.addRow([`Generado el ${fechaGenerado}`]);
  subRow.getCell(1).font = { size: 9, italic: true, color: { argb: "FF94A3B8" } };
  subRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
  ws1.mergeCells(2, 1, 2, 4);
  ws1.addRow([]);

  // Info bebé
  sectionTitle(ws1, "Información del bebé", 4);
  const nombreRowNum = ws1.rowCount + 1;
  infoRow(ws1, "Nombre", baby?.name ?? "—", 4);
  if (fotoId !== null) {
    ws1.addImage(fotoId, { tl: { col: 3.2, row: nombreRowNum - 1 } as any, ext: { width: 48, height: 48 } });
  }
  if (birthDate) {
    infoRow(ws1, "Fecha de nacimiento", birthDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }), 4);
    infoRow(ws1, "Edad", calcEdad(birthDate), 4);
  }
  if (baby?.pesoKg) infoRow(ws1, "Peso actual", `${baby.pesoKg} kg`, 4);
  if (baby?.estaturaCmd) infoRow(ws1, "Talla actual", `${baby.estaturaCmd} cm`, 4);
  infoRow(ws1, "Periodo exportado", `${startDate} a ${endDate}`, 4);

  // Recomendación pañal
  sectionTitle(ws1, "Recomendación de pañal", 4);
  if (recPanal) {
    infoRow(ws1, "Talla recomendada", recPanal.talla, 4);
    infoRow(ws1, "Nombre", recPanal.nombre, 4);
    infoRow(ws1, "Rango de peso", `${recPanal.pesoMin} – ${recPanal.pesoMax < 100 ? recPanal.pesoMax : "+"} kg`, 4);
    infoRow(ws1, "Etapa", `${recPanal.mesesMin} – ${recPanal.mesesMax < 100 ? recPanal.mesesMax : "+"} meses`, 4);
    infoRow(ws1, "Consejo", recPanal.nota, 4);
  } else {
    infoRow(ws1, "—", "Sin datos suficientes (verifica fecha de nacimiento)", 4);
  }

  // Resumen estadístico
  const totalFormula = records.filter(r => r.type === "FORMULA").reduce((s, r) => s + (r.formulaMl ?? 0), 0);
  const suenoRecs = records.filter(r => r.type === "SUENO");
  const totalSueno = suenoRecs.reduce((s, r) => s + (r.pechoMin ?? 0), 0);
  const totalSuenoDay = suenoRecs.filter(r => { const h = new Date(r.recordedAt).getHours(); return h >= 6 && h < 22; }).reduce((s, r) => s + (r.pechoMin ?? 0), 0);
  const totalSuenoNight = totalSueno - totalSuenoDay;
  const totalDespierto = totalSueno > 0 ? Math.max(0, 1440 - totalSueno) : 0;
  function minToHm(min: number): string { if (min <= 0) return "0 min"; const h = Math.floor(min / 60); const m = min % 60; if (h === 0) return `${m} min`; if (m === 0) return `${h}h`; return `${h}h ${m}min`; }
  sectionTitle(ws1, "Resumen del periodo", 4);
  const statsHeaders = ws1.addRow(["Concepto", "Valor"]);
  statsHeaders.height = 20;
  statsHeaders.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle" };
  });
  const medsRecs = records.filter(r => r.type === "MEDICAMENTO");
  const suplRecs = records.filter(r => r.type === "SUPLEMENTO");
  const medsByNameXls = medsRecs.reduce((acc, r) => { const n = r.notes || "Medicamento"; acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<string, number>);
  const suplsByNameXls = suplRecs.reduce((acc, r) => { const n = r.notes || "Suplemento"; acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<string, number>);
  const totalPanalesUnicos = new Set(records.filter(r => r.type === "PANAL_PIPI" || r.type === "PANAL_POPO").map(r => new Date(r.recordedAt).toISOString().slice(0, 16))).size;
  const statsData: [string, string | number][] = [
    ["Total de registros", records.length],
    ["Tomas totales", records.filter(r => r.type === "FORMULA" || r.type === "PECHO").length],
    ["  → Tomas de fórmula", records.filter(r => r.type === "FORMULA").length],
    ["  → Tomas de pecho", records.filter(r => r.type === "PECHO").length],
    ["ml de fórmula (total)", totalFormula],
    ["Pañales únicos (total)", totalPanalesUnicos],
    ["  → Pañales pipí", records.filter(r => r.type === "PANAL_PIPI").length],
    ["  → Pañales popó", records.filter(r => r.type === "PANAL_POPO").length],
    ["Sueño total", minToHm(totalSueno)],
    ["  → Sueño de día (☀️ 06-22h)", minToHm(totalSuenoDay)],
    ["  → Sueño de noche (🌙 22-06h)", minToHm(totalSuenoNight)],
    ...(totalDespierto > 0 ? [["  → Despierto estimado (👁️)", minToHm(totalDespierto)] as [string, string]] : []),
    [`Dosis de medicamento${Object.keys(medsByNameXls).length > 1 ? "s" : ""} (${medsRecs.length} dosis · ${Object.keys(medsByNameXls).length} med)`, Object.entries(medsByNameXls).map(([n, c]) => `${n}: ${c}`).join(", ") || medsRecs.length],
    [`Dosis de suplemento${Object.keys(suplsByNameXls).length > 1 ? "s" : ""} (${suplRecs.length} dosis · ${Object.keys(suplsByNameXls).length} supl)`, Object.entries(suplsByNameXls).map(([n, c]) => `${n}: ${c}`).join(", ") || suplRecs.length],
    ["Actividades de estimulación", checks.length],
  ].filter(([, v]) => v !== 0 && v !== "") as [string, string | number][];
  statsData.forEach(([c, v], i) => dataRow(ws1, [c, v], i % 2 === 0));

  // ── Sheet 2: Registros ────────────────────────────────────────────
  const ws2 = wb.addWorksheet("Registros");
  ws2.columns = [{ width: 14 }, { width: 9 }, { width: 18 }, { width: 14 }, { width: 36 }];

  const ws2Title = ws2.addRow(["🍼 BabyControl — Registros detallados"]);
  ws2Title.height = 26;
  ws2Title.getCell(1).font = { bold: true, size: 13, color: { argb: WHITE } };
  ws2Title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
  ws2Title.getCell(1).alignment = { vertical: "middle" };
  ws2.mergeCells(1, 1, 1, 5);
  ws2.addRow([baby?.name ?? "", `${startDate} → ${endDate}`]).eachCell(cell => {
    cell.font = { size: 9, italic: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
  });
  ws2.mergeCells(2, 1, 2, 3);
  ws2.mergeCells(2, 4, 2, 5);
  ws2.addRow([]);

  headerRow(ws2, ["Fecha", "Hora", "Tipo", "ml / min", "Notas"], PURPLE);

  if (records.length === 0) {
    ws2.addRow(["Sin registros para este periodo", "", "", "", ""]);
  } else {
    records.forEach((r, i) => {
      const dt = new Date(r.recordedAt);
      dataRow(ws2, [
        dt.toLocaleDateString("es-MX"),
        dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
        TIPO_LABEL[r.type] ?? r.type,
        r.formulaMl ?? r.pechoMin ?? "",
        r.notes ?? "",
      ], i % 2 === 0);
    });
  }

  // ── Sheet 3: Estimulación ─────────────────────────────────────────
  const ws3 = wb.addWorksheet("Estimulación");
  ws3.columns = [{ width: 14 }, { width: 55 }, { width: 40 }];

  const ws3Title = ws3.addRow(["🌱 BabyControl — Estimulación temprana"]);
  ws3Title.height = 26;
  ws3Title.getCell(1).font = { bold: true, size: 13, color: { argb: WHITE } };
  ws3Title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: EMERALD } };
  ws3Title.getCell(1).alignment = { vertical: "middle" };
  ws3.mergeCells(1, 1, 1, 3);
  const ws3Sub = ws3.addRow([baby?.name ?? "", `${startDate} → ${endDate}`]);
  ws3Sub.eachCell(cell => {
    cell.font = { size: 9, italic: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EMERALD } };
  });
  ws3.mergeCells(2, 1, 2, 2);
  ws3.addRow([]);

  headerRow(ws3, ["Fecha", "Actividad completada", "Nota del día"], EMERALD);

  const notasMap = new Map(notas.map(n => [n.fecha, n.nota]));
  const estData: { fecha: string; actividad: string; nota: string }[] = [];
  checks.forEach(c => estData.push({ fecha: c.fecha, actividad: getActividadTexto(c.actividad), nota: notasMap.get(c.fecha) ?? "" }));

  if (estData.length === 0) {
    ws3.addRow(["Sin actividades registradas", "", ""]);
  } else {
    estData.forEach((d, i) => dataRow(ws3, [d.fecha, d.actividad, d.nota], i % 2 === 0));
  }

  // ── Sheet 4: Pañal ────────────────────────────────────────────────
  const ws4 = wb.addWorksheet("Pañal");
  ws4.columns = [{ width: 18 }, { width: 22 }, { width: 18 }, { width: 22 }, { width: 40 }];

  const ws4Title = ws4.addRow(["🩲 BabyControl — Guía de pañales"]);
  ws4Title.height = 26;
  ws4Title.getCell(1).font = { bold: true, size: 13, color: { argb: WHITE } };
  ws4Title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SKY } };
  ws4Title.getCell(1).alignment = { vertical: "middle" };
  ws4.mergeCells(1, 1, 1, 5);
  ws4.addRow([]);

  // Recomendación del bebé
  sectionTitle(ws4, `Recomendación para ${baby?.name ?? "el bebé"}`, 5);
  const recRow = ws4.addRow(recPanal
    ? [`Talla ${recPanal.talla} (${recPanal.nombre})`, `${recPanal.pesoMin}–${recPanal.pesoMax < 100 ? recPanal.pesoMax : "+"}kg`, `${recPanal.mesesMin}–${recPanal.mesesMax < 100 ? recPanal.mesesMax : "+"}m`, [baby?.pesoKg ? `Peso: ${baby.pesoKg}kg` : "", baby?.estaturaCmd ? `Talla: ${baby.estaturaCmd}cm` : ""].filter(Boolean).join(" · ") || "Sin datos", recPanal.nota]
    : ["Sin datos suficientes", "", "", "", "Verifica fecha de nacimiento en perfil"]);
  recRow.height = 20;
  recRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
    cell.font = { bold: true, size: 10, color: { argb: SKY } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  ws4.addRow([]);
  sectionTitle(ws4, "Guía completa de tallas", 5);
  headerRow(ws4, ["Talla", "Nombre", "Peso (kg)", "Edad aprox.", "Consejo"], SKY);

  const allTallas = [
    { t: "RN", n: "Recién Nacido", p: "0 – 4", e: "0-1 mes", c: "Para bebés prematuros o de muy bajo peso" },
    { t: "1 (P)", n: "Pequeño", p: "2 – 5.5", e: "0-3 meses", c: "Etapa de recién nacido, cambiar cada 2-3 horas" },
    { t: "2 (M)", n: "Mediano", p: "4 – 8", e: "2-6 meses", c: "Crecimiento acelerado, revisar ajuste en piernas y cintura" },
    { t: "3 (G)", n: "Grande", p: "6 – 11", e: "5-12 meses", c: "Bebé más activo, buena elasticidad en cintura y piernas" },
    { t: "4 (XG)", n: "Extra Grande", p: "9 – 14", e: "10-24 meses", c: "Inicio de gateo y primeros pasos, ajuste flexible" },
    { t: "5 (XXG)", n: "Extra Extra Grande", p: "12 – 18", e: "18-36 meses", c: "Niños activos, inicio de entrenamiento de baño" },
    { t: "6", n: "Talla 6", p: "16+", e: "30+ meses", c: "Etapa final antes del control de esfínteres" },
  ];
  allTallas.forEach((row, i) => {
    const isRec = recPanal?.talla === row.t;
    const dr = dataRow(ws4, [row.t, row.n, row.p, row.e, row.c], i % 2 === 0);
    if (isRec) {
      dr.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
        cell.font = { bold: true, size: 10, color: { argb: SKY } };
      });
    }
  });

  ws4.addRow([]);
  const noteRow = ws4.addRow(["* Las tallas varían entre marcas (Pampers, Huggies, Winnie Pooh). Verifica siempre el empaque."]);
  noteRow.getCell(1).font = { italic: true, size: 9, color: { argb: "FF94A3B8" } };
  ws4.mergeCells(noteRow.number, 1, noteRow.number, 5);

  const buffer = await wb.xlsx.writeBuffer();
  const nombre = (baby?.name ?? "bebe").replace(/\s+/g, "-").toLowerCase();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="babycontrol-${nombre}-${startDate}.xlsx"`,
    },
  });
}
