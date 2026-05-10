"use client";
import * as React from "react";
import { useParams } from "next/navigation";

import { getActividadTexto, getRecomendacionPanal } from "@/lib/guias";

type RecordItem = { id: string; type: string; formulaMl: number | null; pechoMin: number | null; notes: string | null; recordedAt: string };
type Baby = { id: string; name: string; birthDate: string | null; pesoKg: number | null; estaturaCmd: number | null; fotoUrl: string | null };
type GrupoStats = { label: string; formula: number; tomas: number; formulaTomas: number; pechoTomas: number; pipi: number; popo: number; panalesUnicos: number; sueno: number; suenoDay: number; suenoNight: number; suenoDespierto: number; meds: number; supls: number };
type EstimulDia = { checks: string[]; nota: string | null };
type EstimulData = Record<string, EstimulDia>;

const VERSION = "v1.0";

type VacunaRec = { id: string; nombre: string; folio: string | null; aplicadaEn: string | null; clinica: string | null };
type Tratamiento = { id: string; nombre: string; activo: boolean; administraciones: { id: string; administradoEn: string }[] };

const VACUNAS_CALENDARIO: { nombre: string; edadMeses: number; etiqueta: string }[] = [
  { nombre: "BCG", edadMeses: 0, etiqueta: "Al nacer" },
  { nombre: "Hepatitis B (1a dosis)", edadMeses: 0, etiqueta: "Al nacer" },
  { nombre: "Hexavalente (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
  { nombre: "Rotavirus (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
  { nombre: "Neumococo (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
  { nombre: "Hexavalente (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
  { nombre: "Rotavirus (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
  { nombre: "Neumococo (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
  { nombre: "Hexavalente (3a dosis)", edadMeses: 6, etiqueta: "6 meses" },
  { nombre: "Rotavirus (3a dosis)", edadMeses: 6, etiqueta: "6 meses" },
  { nombre: "Hepatitis B (2a dosis)", edadMeses: 6, etiqueta: "6 meses" },
  { nombre: "Influenza (1a dosis)", edadMeses: 7, etiqueta: "7 meses" },
  { nombre: "Influenza (2a dosis)", edadMeses: 8, etiqueta: "8 meses" },
  { nombre: "SRP (1a dosis)", edadMeses: 12, etiqueta: "12 meses" },
  { nombre: "Varicela (1a dosis)", edadMeses: 12, etiqueta: "12 meses" },
  { nombre: "Neumococo (refuerzo)", edadMeses: 12, etiqueta: "12 meses" },
  { nombre: "Hepatitis A (1a dosis)", edadMeses: 18, etiqueta: "18 meses" },
  { nombre: "Hexavalente (refuerzo)", edadMeses: 18, etiqueta: "18 meses" },
  { nombre: "SR", edadMeses: 24, etiqueta: "24 meses" },
  { nombre: "Hepatitis A (2a dosis)", edadMeses: 24, etiqueta: "24 meses" },
  { nombre: "DPT (refuerzo)", edadMeses: 48, etiqueta: "4 años" },
  { nombre: "SRP (2a dosis)", edadMeses: 48, etiqueta: "4 años" },
  { nombre: "Sabin/IPV (refuerzo)", edadMeses: 48, etiqueta: "4 años" },
];

function calcEdadMeses(birthDate: string): number {
  const birth = new Date(birthDate.slice(0, 10) + "T12:00:00");
  const now = new Date();
  let m = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) m--;
  return Math.max(0, m);
}

const TIPO_LABEL: Record<string, { emoji: string; label: string }> = {
  FORMULA:    { emoji: "🍼", label: "Fórmula" },
  PECHO:      { emoji: "🤱", label: "Pecho" },
  PANAL_PIPI: { emoji: "💧", label: "Pañal Pipí" },
  PANAL_POPO: { emoji: "💩", label: "Pañal Popó" },
  SUENO:      { emoji: "😴", label: "Sueño" },
  PESO:       { emoji: "⚖️", label: "Peso" },
  TEMPERATURA:{ emoji: "🌡️", label: "Temperatura" },
  MEDICAMENTO:{ emoji: "💊", label: "Medicamento" },
  SUPLEMENTO: { emoji: "🧴", label: "Suplemento" },
};

function calcularEdad(birthDate: string): string {
  const days = Math.floor((Date.now() - new Date(birthDate.slice(0,10) + "T12:00:00").getTime()) / 86400000);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(months / 12);
  if (years >= 1) return `${years} año${years > 1 ? "s" : ""}`;
  if (months >= 1) return `${months} mes${months > 1 ? "es" : ""}`;
  return `${days} día${days !== 1 ? "s" : ""}`;
}

function periodoLabel(periodo: string, fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  if (periodo === "dia") return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  if (periodo === "semana") {
    const start = new Date(d); start.setDate(d.getDate() - 6);
    return `${start.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (periodo === "mes") return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  if (periodo === "anio") return `Año ${d.getFullYear()}`;
  return fecha;
}

function getRange(periodo: string, fecha: string): { start: string; end: string } {
  const d = new Date(fecha + "T00:00:00");
  if (periodo === "dia") return { start: d.toISOString(), end: new Date(fecha + "T23:59:59.999").toISOString() };
  if (periodo === "semana") {
    const start = new Date(d); start.setDate(d.getDate() - 6);
    return { start: start.toISOString(), end: new Date(fecha + "T23:59:59.999").toISOString() };
  }
  if (periodo === "mes") {
    return { start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(), end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString() };
  }
  // anio
  return { start: new Date(d.getFullYear(), 0, 1).toISOString(), end: new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString() };
}

function agrupar(records: RecordItem[], periodo: string): GrupoStats[] {
  if (periodo === "dia") return [];
  const map = new Map<string, GrupoStats>();
  const panalSets = new Map<string, Set<string>>();

  records.forEach(r => {
    const dt = new Date(r.recordedAt);
    let key: string;
    if (periodo === "semana") {
      key = dt.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
    } else if (periodo === "mes") {
      const semana = Math.ceil(dt.getDate() / 7);
      key = `Semana ${semana}`;
    } else {
      key = dt.toLocaleDateString("es-MX", { month: "long" });
    }
    if (!map.has(key)) { map.set(key, { label: key, formula: 0, tomas: 0, formulaTomas: 0, pechoTomas: 0, pipi: 0, popo: 0, panalesUnicos: 0, sueno: 0, suenoDay: 0, suenoNight: 0, suenoDespierto: 0, meds: 0, supls: 0 }); panalSets.set(key, new Set()); }
    const g = map.get(key)!;
    if (r.type === "FORMULA")     { g.formula += r.formulaMl ?? 0; g.tomas++; g.formulaTomas++; }
    if (r.type === "PECHO")       { g.tomas++; g.pechoTomas++; }
    if (r.type === "PANAL_PIPI")  { g.pipi++; panalSets.get(key)!.add(new Date(r.recordedAt).toISOString().slice(0, 16)); }
    if (r.type === "PANAL_POPO")  { g.popo++; panalSets.get(key)!.add(new Date(r.recordedAt).toISOString().slice(0, 16)); }
    if (r.type === "SUENO") {
      const min = r.pechoMin ?? 0;
      g.sueno += min;
      const hora = new Date(r.recordedAt).getHours();
      if (hora >= 6 && hora < 22) g.suenoDay += min; else g.suenoNight += min;
    }
    if (r.type === "MEDICAMENTO") g.meds++;
    if (r.type === "SUPLEMENTO")  g.supls++;
  });

  const result = Array.from(map.entries()).map(([key, g]) => { g.panalesUnicos = panalSets.get(key)?.size ?? 0; return g; });
  result.forEach(g => { if (g.sueno > 0) g.suenoDespierto = Math.max(0, 1440 - g.sueno); });
  return result;
}

export default function ExportPage() {
  const params = useParams();
  const babyId = params.id as string;
  const hoy = new Date().toISOString().slice(0, 10);

  const [baby, setBaby] = React.useState<Baby | null>(null);
  const [records, setRecords] = React.useState<RecordItem[]>([]);
  const [estimulData, setEstimulData] = React.useState<EstimulData>({});
  const [loading, setLoading] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);
  const [periodo, setPeriodo] = React.useState("semana");
  const [fecha, setFecha] = React.useState(hoy);
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [vacunas, setVacunas] = React.useState<VacunaRec[]>([]);
  const [tratamientos, setTratamientos] = React.useState<Tratamiento[]>([]);
  const [suplTratamientos, setSuplTratamientos] = React.useState<Tratamiento[]>([]);
  const [modoExport, setModoExport] = React.useState<"resumen" | "detalle">("detalle");

  async function generar(per: string, fec: string) {
    setLoading(true);
    setGenerated(false);
    const { start, end } = getRange(per, fec);
    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      fetch("/api/baby?babyId=" + babyId),
      fetch(`/api/records?babyId=${babyId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
      fetch(`/api/estimulacion?babyId=${babyId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
      fetch("/api/vacuna?babyId=" + babyId),
      fetch("/api/medicamento-tratamiento?babyId=" + babyId),
      fetch("/api/suplemento-tratamiento?babyId=" + babyId),
    ]);
    if (r1.ok) setBaby(await r1.json());
    if (r2.ok) { const recs: RecordItem[] = await r2.json(); setRecords([...recs].reverse()); }
    if (r3.ok) setEstimulData(await r3.json());
    if (r4.ok) setVacunas(await r4.json());
    if (r5.ok) setTratamientos(await r5.json());
    if (r6.ok) setSuplTratamientos(await r6.json());
    setLoading(false);
    setGenerated(true);
  }

  async function exportarExcel() {
    setExportingExcel(true);
    const { start, end } = getRange(periodo, fecha);
    const r = await fetch(`/api/export/excel?babyId=${babyId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    if (r.ok) {
      const blob = await r.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `babycontrol-${baby?.name ?? "bebe"}-${fecha}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
    setExportingExcel(false);
  }

  const totalFormula     = records.filter(r => r.type === "FORMULA").reduce((s, r) => s + (r.formulaMl ?? 0), 0);
  const totalTomas       = records.filter(r => r.type === "FORMULA" || r.type === "PECHO").length;
  const totalFormulaTom  = records.filter(r => r.type === "FORMULA").length;
  const totalPechoTom    = records.filter(r => r.type === "PECHO").length;
  const totalPipi        = records.filter(r => r.type === "PANAL_PIPI").length;
  const totalPopo        = records.filter(r => r.type === "PANAL_POPO").length;
  const totalPanales     = new Set(records.filter(r => r.type === "PANAL_PIPI" || r.type === "PANAL_POPO").map(r => new Date(r.recordedAt).toISOString().slice(0, 16))).size;
  const suenoRecs        = records.filter(r => r.type === "SUENO");
  const totalSueno       = suenoRecs.reduce((s, r) => s + (r.pechoMin ?? 0), 0);
  const totalSuenoDay    = suenoRecs.filter(r => new Date(r.recordedAt).getHours() >= 6 && new Date(r.recordedAt).getHours() < 22).reduce((s, r) => s + (r.pechoMin ?? 0), 0);
  const totalSuenoNight  = totalSueno - totalSuenoDay;
  const totalDespierto   = totalSueno > 0 ? Math.max(0, 1440 - totalSueno) : 0;
  const { start: periodoStart, end: periodoEnd } = getRange(periodo, fecha);
  const startMs = new Date(periodoStart).getTime();
  const endMs   = new Date(periodoEnd).getTime();
  const medsBreakdown  = tratamientos.map(t => ({ nombre: t.nombre, count: t.administraciones.filter(a => { const ts = new Date(a.administradoEn).getTime(); return ts >= startMs && ts <= endMs; }).length })).filter(t => t.count > 0);
  const suplsBreakdown = suplTratamientos.map(t => ({ nombre: t.nombre, count: t.administraciones.filter(a => { const ts = new Date(a.administradoEn).getTime(); return ts >= startMs && ts <= endMs; }).length })).filter(t => t.count > 0);
  const totalMeds = medsBreakdown.reduce((s, t) => s + t.count, 0);
  const totalSupl = suplsBreakdown.reduce((s, t) => s + t.count, 0);
  function minToHm(min: number): string { if (min <= 0) return "0 min"; const h = Math.floor(min / 60); const m = min % 60; if (h === 0) return `${m} min`; if (m === 0) return `${h}h`; return `${h}h ${m}min`; }
  const grupos       = agrupar(records, periodo);
  const fechaGenerado = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const desgloseTitulo = periodo === "semana" ? "Desglose por día" : periodo === "mes" ? "Desglose por semana" : "Desglose por mes";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Panel de control */}
      <div className="print:hidden">
        <div className="bg-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">📄 Exportar Reporte PDF</h1>
          <button onClick={() => window.history.back()} className="text-purple-200 hover:text-white text-sm">← Volver</button>
        </div>
        <div className="bg-white border-b px-6 py-5 space-y-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Periodo</p>
            <div className="flex gap-2 flex-wrap">
              {[["dia","Día"],["semana","Semana"],["mes","Mes"],["anio","Año"]].map(([p, label]) => (
                <button key={p} onClick={() => setPeriodo(p)} className={"px-5 py-2 rounded-2xl font-semibold text-sm border-2 transition-all " + (periodo === p ? "bg-purple-600 text-white border-purple-600 shadow-md" : "border-slate-200 text-slate-600 bg-white hover:border-purple-300")}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1 uppercase tracking-wide">Fecha de referencia</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} max={hoy} className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500" />
            </div>
            <button onClick={() => generar(periodo, fecha)} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold text-sm disabled:opacity-50">
              {loading ? "Cargando..." : "Generar reporte"}
            </button>
            {generated && (
              <button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold text-sm">
                🖨️ Guardar PDF
              </button>
            )}
            {generated && (
              <button onClick={exportarExcel} disabled={exportingExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-semibold text-sm disabled:opacity-50">
                {exportingExcel ? "Generando..." : "📊 Exportar Excel"}
              </button>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Vista del reporte</p>
            <div className="flex rounded-xl border-2 border-slate-200 overflow-hidden w-fit">
              <button onClick={() => setModoExport("resumen")} className={"px-5 py-2 font-semibold text-sm transition-all " + (modoExport === "resumen" ? "bg-purple-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                Resumen
              </button>
              <button onClick={() => setModoExport("detalle")} className={"px-5 py-2 font-semibold text-sm transition-all border-l-2 border-slate-200 " + (modoExport === "detalle" ? "bg-purple-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                Detalle
              </button>
            </div>
          </div>
          {loading && <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /><p className="text-purple-600 text-sm">Cargando registros...</p></div>}
        </div>
      </div>

      {/* Reporte */}
      {generated && baby && (
        <div className="max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0 print:max-w-none space-y-8">

          {/* Encabezado */}
          <div className="border-b-4 border-purple-600 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 font-black text-3xl tracking-tight">BabyControl</p>
                <p className="text-slate-400 text-sm mt-0.5">Reporte de salud y cuidado</p>
                <p className="text-purple-300 text-xs mt-1 font-semibold tracking-widest uppercase">{VERSION}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Generado el</p>
                  <p className="text-sm font-semibold text-slate-700">{fechaGenerado}</p>
                </div>
                <img src="/logo-babycontrol.png" alt="BabyControl" style={{ height: 80, width: "auto" }} />
              </div>
            </div>
          </div>

          {/* Info bebé */}
          <div className="grid grid-cols-2 gap-6 bg-purple-50 rounded-2xl p-6 border border-purple-100">
            <div className="space-y-1">
              <p className="text-xs text-purple-500 font-bold uppercase tracking-widest mb-2">Bebé</p>
              <div className="flex items-center gap-3">
                {baby.fotoUrl && <img src={baby.fotoUrl} alt={baby.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #c4b5fd" }} />}
                <p className="text-3xl font-black text-purple-900">{baby.name}</p>
              </div>
              {baby.birthDate && <>
                <p className="text-sm text-purple-700">Edad: <strong>{calcularEdad(baby.birthDate)}</strong></p>
                <p className="text-sm text-purple-700">Nacimiento: <strong>{new Date(baby.birthDate.slice(0,10) + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</strong></p>
              </>}
              {baby.pesoKg && <p className="text-sm text-purple-700 mt-1">Peso: <strong>{baby.pesoKg} kg</strong></p>}
              {baby.estaturaCmd && <p className="text-sm text-purple-700">Talla: <strong>{baby.estaturaCmd} cm</strong></p>}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-purple-500 font-bold uppercase tracking-widest mb-2">Periodo</p>
              <p className="text-xl font-bold text-purple-900">{periodo === "dia" ? "Día" : periodo === "semana" ? "Semana" : periodo === "mes" ? "Mes" : "Año"}</p>
              <p className="text-sm text-purple-700">{periodoLabel(periodo, fecha)}</p>
              <p className="text-sm text-purple-500 mt-2">{records.length} registros totales</p>
            </div>
          </div>

          {/* Totales */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">Resumen total</h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl p-4 text-center border border-purple-100 bg-purple-50 col-span-2"><p className="text-3xl font-black text-purple-600">{totalTomas}</p><p className="text-xs font-semibold text-purple-700 mt-1">Tomas totales</p><p className="text-xs text-purple-400 mt-0.5">🍼 {totalFormulaTom} fórmula · 🤱 {totalPechoTom} pecho</p></div>
              <div className="rounded-xl p-4 text-center border border-blue-100 bg-blue-50 col-span-2"><p className="text-3xl font-black text-blue-600">{totalFormula}</p><p className="text-xs font-semibold text-blue-700 mt-1">ml Fórmula total</p></div>
              {totalPanales > 0 && <div className="rounded-xl p-4 text-center border border-yellow-200 bg-yellow-50 col-span-2"><p className="text-3xl font-black text-yellow-700">{totalPanales}</p><p className="text-xs font-semibold text-yellow-700 mt-1">🧷 Total pañales únicos</p><p className="text-xs text-yellow-500 mt-0.5">💧 {totalPipi} pipí · 💩 {totalPopo} popó</p></div>}
              {totalPanales === 0 && totalPipi > 0 && <div className="rounded-xl p-4 text-center border border-yellow-100 bg-yellow-50"><p className="text-3xl font-black text-yellow-600">{totalPipi}</p><p className="text-xs font-semibold text-yellow-700 mt-1">Pañales 💧</p></div>}
              {totalPanales === 0 && totalPopo > 0 && <div className="rounded-xl p-4 text-center border border-amber-100 bg-amber-50"><p className="text-3xl font-black text-amber-600">{totalPopo}</p><p className="text-xs font-semibold text-amber-700 mt-1">Pañales 💩</p></div>}
              {totalSueno > 0 && <>
                <div className="rounded-xl p-4 text-center border border-indigo-100 bg-indigo-50 col-span-2"><p className="text-2xl font-black text-indigo-600">{minToHm(totalSueno)}</p><p className="text-xs font-semibold text-indigo-700 mt-1">Sueño total 😴</p><p className="text-xs text-indigo-400 mt-0.5">{totalSueno} min</p></div>
                <div className="rounded-xl p-4 text-center border border-amber-100 bg-amber-50"><p className="text-xl font-black text-amber-600">{minToHm(totalSuenoDay)}</p><p className="text-xs font-semibold text-amber-700 mt-1">☀️ Sueño día</p></div>
                <div className="rounded-xl p-4 text-center border border-blue-100 bg-blue-50"><p className="text-xl font-black text-blue-600">{minToHm(totalSuenoNight)}</p><p className="text-xs font-semibold text-blue-700 mt-1">🌙 Sueño noche</p></div>
                {totalDespierto > 0 && <div className="rounded-xl p-4 text-center border border-slate-200 bg-slate-50 col-span-2"><p className="text-xl font-black text-slate-600">{minToHm(totalDespierto)}</p><p className="text-xs font-semibold text-slate-500 mt-1">👁️ Despierto estimado</p></div>}
              </>}
              {totalMeds > 0 && <div className="rounded-xl p-4 text-center border border-red-100 bg-red-50"><p className="text-3xl font-black text-red-600">{totalMeds}</p><p className="text-xs font-semibold text-red-700 mt-1">💊 Dosis total</p>{medsBreakdown.length > 0 && <p className="text-xs text-red-400 mt-0.5">{medsBreakdown.length} medicamento{medsBreakdown.length !== 1 ? "s" : ""}</p>}</div>}
              {totalSupl > 0 && <div className="rounded-xl p-4 text-center border border-teal-100 bg-teal-50"><p className="text-3xl font-black text-teal-600">{totalSupl}</p><p className="text-xs font-semibold text-teal-700 mt-1">🧴 Dosis total</p>{suplsBreakdown.length > 0 && <p className="text-xs text-teal-400 mt-0.5">{suplsBreakdown.length} suplemento{suplsBreakdown.length !== 1 ? "s" : ""}</p>}</div>}
            </div>
          </div>

          {/* Desglose por período */}
          {grupos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">{desgloseTitulo}</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-purple-700 text-white">
                    <th className="text-left px-4 py-3 font-semibold rounded-tl-lg">{periodo === "semana" ? "Día" : periodo === "mes" ? "Semana" : "Mes"}</th>
                    <th className="text-center px-3 py-3 font-semibold">Tomas</th>
                    <th className="text-center px-3 py-3 font-semibold">🍼</th>
                    <th className="text-center px-3 py-3 font-semibold">🤱</th>
                    <th className="text-center px-3 py-3 font-semibold">ml</th>
                    <th className="text-center px-3 py-3 font-semibold">🧷</th>
                    <th className="text-center px-3 py-3 font-semibold">💧</th>
                    <th className="text-center px-3 py-3 font-semibold">💩</th>
                    {grupos.some(g => g.sueno > 0) && <th className="text-center px-3 py-3 font-semibold">😴 Total</th>}
                    {grupos.some(g => g.suenoDay > 0) && <th className="text-center px-3 py-3 font-semibold">☀️ Día</th>}
                    {grupos.some(g => g.suenoNight > 0) && <th className="text-center px-3 py-3 font-semibold">🌙 Noche</th>}
                    {grupos.some(g => g.suenoDespierto > 0) && <th className="text-center px-3 py-3 font-semibold">👁️ Despierto</th>}
                    {grupos.some(g => g.meds > 0) && <th className="text-center px-3 py-3 font-semibold">💊</th>}
                    <th className="text-center px-3 py-3 font-semibold rounded-tr-lg">🧴</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((g, i) => (
                    <tr key={g.label} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-semibold text-slate-700 capitalize">{g.label}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{g.tomas || "—"}</td>
                      <td className="px-3 py-3 text-center text-blue-600">{g.formulaTomas || "—"}</td>
                      <td className="px-3 py-3 text-center text-pink-600">{g.pechoTomas || "—"}</td>
                      <td className="px-3 py-3 text-center text-blue-700 font-medium">{g.formula > 0 ? g.formula : "—"}</td>
                      <td className="px-3 py-3 text-center text-yellow-800 font-semibold">{g.panalesUnicos || "—"}</td>
                      <td className="px-3 py-3 text-center text-yellow-700">{g.pipi || "—"}</td>
                      <td className="px-3 py-3 text-center text-amber-700">{g.popo || "—"}</td>
                      {grupos.some(x => x.sueno > 0) && <td className="px-3 py-3 text-center text-indigo-700">{g.sueno > 0 ? minToHm(g.sueno) : "—"}</td>}
                      {grupos.some(x => x.suenoDay > 0) && <td className="px-3 py-3 text-center text-amber-600">{g.suenoDay > 0 ? minToHm(g.suenoDay) : "—"}</td>}
                      {grupos.some(x => x.suenoNight > 0) && <td className="px-3 py-3 text-center text-blue-600">{g.suenoNight > 0 ? minToHm(g.suenoNight) : "—"}</td>}
                      {grupos.some(x => x.suenoDespierto > 0) && <td className="px-3 py-3 text-center text-slate-500">{g.suenoDespierto > 0 ? minToHm(g.suenoDespierto) : "—"}</td>}
                      {grupos.some(x => x.meds > 0) && <td className="px-3 py-3 text-center text-red-700">{g.meds > 0 ? g.meds : "—"}</td>}
                      <td className="px-3 py-3 text-center text-teal-700">{g.supls > 0 ? g.supls : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Registros detallados */}
          {modoExport === "detalle" && records.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">Registros detallados</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-purple-700 text-white">
                    <th className="text-left px-4 py-3 font-semibold rounded-tl-lg">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold">Hora</th>
                    <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold rounded-tr-lg">Detalle / Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const t = TIPO_LABEL[r.type];
                    const dt = new Date(r.recordedAt);
                    const detalles: string[] = [];
                    if (r.formulaMl) detalles.push(r.formulaMl + " ml");
                    if (r.type === "SUENO" && r.pechoMin) {
                      const isDay = new Date(r.recordedAt).getHours() >= 6 && new Date(r.recordedAt).getHours() < 22;
                      detalles.push(`${isDay ? "☀️" : "🌙"} ${minToHm(r.pechoMin)}`);
                    } else if (r.pechoMin) {
                      detalles.push(r.pechoMin + " min");
                    }
                    if (r.notes) detalles.push(r.notes);
                    return (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">
                          {dt.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: periodo === "anio" ? "numeric" : undefined })}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{t?.emoji} {t?.label ?? r.type}</td>
                        <td className="px-4 py-2.5 text-slate-600 italic">{detalles.join(" · ") || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {records.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-slate-400 font-medium">Sin registros para este periodo</p>
            </div>
          )}

          {/* Estimulación */}
          {Object.keys(estimulData).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">Estimulación temprana</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-emerald-700 text-white">
                    <th className="text-left px-4 py-3 font-semibold rounded-tl-lg">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold">Actividades completadas</th>
                    <th className="text-left px-4 py-3 font-semibold rounded-tr-lg">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(estimulData).sort(([a], [b]) => a.localeCompare(b)).map(([fecha, dia], i) => (
                    <tr key={fecha} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-semibold text-slate-700 align-top whitespace-nowrap">
                        {new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-slate-700 align-top">
                        {dia.checks.length === 0 ? <span className="text-slate-400 italic">—</span> : (
                          <ul className="space-y-0.5">
                            {dia.checks.map(k => <li key={k} className="flex items-start gap-1"><span className="text-emerald-500 mt-0.5">✓</span><span>{getActividadTexto(k)}</span></li>)}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 italic align-top">{dia.nota || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pañal */}
          {baby.birthDate && (() => {
            const meses = calcEdadMeses(baby.birthDate!);
            const rec = getRecomendacionPanal(meses, baby.pesoKg);
            if (!rec) return null;
            return (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">Talla de pañal recomendada 🩲</h2>
                <div className="bg-sky-50 rounded-2xl p-5 border border-sky-200 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-black text-sky-600">{rec.talla}</p>
                    <p className="text-sm font-semibold text-sky-800 mt-1">{rec.nombre}</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-sky-700">Edad: <strong>{rec.mesesMin}–{rec.mesesMax < 100 ? rec.mesesMax : "+"} meses</strong></p>
                    <p className="text-sm text-sky-700">Peso: <strong>{rec.pesoMin}–{rec.pesoMax < 100 ? rec.pesoMax : "+"} kg</strong></p>
                    {baby.pesoKg && <p className="text-sm text-sky-700">Peso actual: <strong>{baby.pesoKg} kg</strong>{baby.estaturaCmd ? ` · Talla: ${baby.estaturaCmd} cm` : ""} · {meses} meses</p>}
                    <p className="text-xs text-sky-500 italic mt-1">{rec.nota}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">* Las tallas varían entre marcas (Pampers, Huggies, Winnie Pooh). Verifica el empaque.</p>
              </div>
            );
          })()}

          {/* Vacunas */}
          {baby.birthDate && (() => {
            const meses = calcEdadMeses(baby.birthDate!);
            const debidas = VACUNAS_CALENDARIO.filter(v => v.edadMeses <= meses + 1);
            const futuras = VACUNAS_CALENDARIO.filter(v => v.edadMeses > meses + 1);
            const aplicada = (nombre: string) => vacunas.find(v => v.nombre === nombre);
            return (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">Cartilla de vacunación 💉</h2>
                <p className="text-xs text-slate-400 mb-3">Esquema México · {meses} meses de edad · {debidas.length} vacunas debidas según edad</p>
                <div className="space-y-2 mb-4">
                  {debidas.map(v => {
                    const ap = aplicada(v.nombre);
                    return (
                      <div key={v.nombre} className={"rounded-xl p-3 border flex items-start gap-3 " + (ap ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                        <span className="text-lg mt-0.5">{ap ? "🟢" : "🔴"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={"text-sm font-bold " + (ap ? "text-green-800" : "text-red-800")}>{v.nombre}</p>
                          <p className="text-xs text-slate-500">{v.etiqueta}</p>
                          {ap && ap.aplicadaEn && <p className="text-xs text-green-600">{new Date(ap.aplicadaEn).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}{ap.clinica ? " · " + ap.clinica : ""}</p>}
                          {ap && ap.folio && <p className="text-xs text-slate-400">Folio: {ap.folio}</p>}
                          {!ap && <p className="text-xs text-red-600 font-semibold">NO se ha aplicado</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {futuras.length > 0 && <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Próximas vacunas ({futuras.length})</p>
                  <div className="space-y-1">{futuras.slice(0, 5).map(v => (
                    <div key={v.nombre} className="rounded-xl p-2 border border-slate-200 bg-slate-50 flex items-center gap-3">
                      <span className="text-base">⚪</span>
                      <p className="text-xs text-slate-600 font-medium">{v.nombre}</p>
                      <span className="text-xs text-slate-400 ml-auto">{v.etiqueta}</span>
                    </div>
                  ))}</div>
                </div>}
              </div>
            );
          })()}

          {/* Pie */}
          <div className="border-t-2 border-slate-200 pt-5 flex items-center justify-center gap-3">
            <img src="/logo-babycontrol.png" alt="BabyControl" style={{ height: 28, width: "auto" }} />
            <p className="text-xs text-slate-400">BabyControl {VERSION} · {baby.name} · {periodoLabel(periodo, fecha)} · {fechaGenerado}</p>
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="max-w-3xl mx-auto px-8 py-20 text-center print:hidden">
          <div className="flex justify-center mb-4"><img src="/logo-babycontrol.png" alt="BabyControl" style={{ height: 100, width: "auto" }} /></div>
          <p className="text-slate-500 text-lg font-semibold">Selecciona el periodo y genera el reporte</p>
          <p className="text-slate-400 text-sm mt-2">Elige entre día, semana, mes o año y haz clic en &ldquo;Generar reporte&rdquo;</p>
        </div>
      )}
    </div>
  );
}
