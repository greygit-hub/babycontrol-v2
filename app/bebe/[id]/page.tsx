"use client";
import * as React from "react";
import { useRouter, useParams } from "next/navigation";

const TIPOS = [
  { value: "FORMULA", emoji: "🍼", label: "Fórmula", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { value: "PECHO", emoji: "🤱", label: "Pecho", color: "bg-pink-100 border-pink-300 text-pink-800" },
  { value: "PANAL_PIPI", emoji: "💧", label: "Pipí", color: "bg-yellow-100 border-yellow-300 text-yellow-800" },
  { value: "PANAL_POPO", emoji: "💩", label: "Popó", color: "bg-amber-100 border-amber-300 text-amber-800" },
  { value: "SUENO", emoji: "😴", label: "Sueño", color: "bg-purple-100 border-purple-300 text-purple-800" },
  { value: "PESO", emoji: "⚖️", label: "Peso", color: "bg-green-100 border-green-300 text-green-800" },
  { value: "TEMPERATURA", emoji: "🌡️", label: "Temperatura", color: "bg-orange-100 border-orange-300 text-orange-800" },
  { value: "MEDICAMENTO", emoji: "💊", label: "Medicamento", color: "bg-red-100 border-red-300 text-red-800" },
  { value: "SUPLEMENTO", emoji: "🧴", label: "Suplemento", color: "bg-teal-100 border-teal-300 text-teal-800" },
];

type RecordItem = { id: string; type: string; formulaMl: number | null; pechoMin: number | null; notes: string | null; recordedAt: string };
type Diagnostico = { bebe: { pesoKg: number; edadTexto: string; mlRecomendadosDia: number; mlMinPorToma: number; mlMaxPorToma: number; tomasMinDia: number; tomasMaxDia: number; pipiMinimo: number }; alertasCriticas: string[]; alertas: string[]; positivos: string[] };
type BabyInfo = { id: string; name: string; fotoUrl: string | null; pesoKg: number | null };
type ReminderItem = { id: string; title: string; reminderType: string; isActive: boolean; reminderTime: string };
type DiaStats = { fecha: string; formula: number; tomas: number; pipi: number; popo: number; sueno: number; medicamentos: number; suplementos: number };
type StatsData = { dias: DiaStats[]; promedios: { formula: number; tomas: number; pipi: number; popo: number; sueno: number; medicamentos: number; suplementos: number }; totalRegistros: number };
type Seccion = "inicio" | "registro" | "estadisticas" | "recordatorios" | "perfil";

export default function BebePage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.id as string;
  const hoyStr = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); })();
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Mexico_City";
  const [seccion, setSeccion] = React.useState<Seccion>("inicio");
  const [baby, setBaby] = React.useState<BabyInfo | null>(null);
  const [records, setRecords] = React.useState<RecordItem[]>([]);
  const [reminders, setReminders] = React.useState<ReminderItem[]>([]);
  const [diagnostico, setDiagnostico] = React.useState<Diagnostico | null>(null);
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [periodo, setPeriodo] = React.useState<"semana" | "mes">("semana");
  const [fechaSeleccionada, setFechaSeleccionada] = React.useState(hoyStr);
  const esHoy = fechaSeleccionada === hoyStr;
  const [tipo, setTipo] = React.useState("FORMULA");
  const [formulaMl, setFormulaMl] = React.useState("");
  const [pechoMin, setPechoMin] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [horaRegistro, setHoraRegistro] = React.useState(() => new Date().toTimeString().slice(0, 5));
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [rTitle, setRTitle] = React.useState("");
  const [rTime, setRTime] = React.useState("08:00");
  const [rType, setRType] = React.useState("FORMULA");
  const [savingR, setSavingR] = React.useState(false);
  const [savedR, setSavedR] = React.useState(false);
  const [deletingR, setDeletingR] = React.useState<string | null>(null);
  const [nuevoPeso, setNuevoPeso] = React.useState("");
  const [savingPeso, setSavingPeso] = React.useState(false);
  const [savedPeso, setSavedPeso] = React.useState(false);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editFormulaMl, setEditFormulaMl] = React.useState("");
  const [editPechoMin, setEditPechoMin] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editHora, setEditHora] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [expandedReminderId, setExpandedReminderId] = React.useState<string | null>(null);
  const [aiAnalisis, setAiAnalisis] = React.useState<string | null>(null);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [notifPermission, setNotifPermission] = React.useState("default");

  React.useEffect(() => { loadAll(); }, [babyId]);
  React.useEffect(() => { loadRecords(); }, [fechaSeleccionada]);
  React.useEffect(() => { loadStats(); }, [periodo, babyId]);
  React.useEffect(() => { if (typeof Notification !== "undefined") setNotifPermission(Notification.permission); }, []);
  React.useEffect(() => { scheduleNotifications(reminders); }, [reminders]);

  function dayRange(dateStr: string) {
    const s = new Date(dateStr + "T00:00:00").toISOString();
    const e = new Date(dateStr + "T23:59:59.999").toISOString();
    return "start=" + s + "&end=" + e;
  }

  function checkMedsAndLoadAI(recs: RecordItem[]) {
    const meds = recs.filter(r => (r.type === "MEDICAMENTO" || r.type === "SUPLEMENTO") && r.notes).map(r => r.notes as string);
    if (meds.length > 0) loadAI(meds); else setAiAnalisis(null);
  }

  async function loadAll() {
    const [r1, r2, r3, r4] = await Promise.all([
      fetch("/api/records?babyId=" + babyId + "&" + dayRange(hoyStr)),
      fetch("/api/reminders?babyId=" + babyId),
      fetch("/api/diagnostico?babyId=" + babyId + "&" + dayRange(hoyStr)),
      fetch("/api/baby?babyId=" + babyId),
    ]);
    if (r1.ok) { const recs: RecordItem[] = await r1.json(); setRecords(recs); checkMedsAndLoadAI(recs); }
    if (r2.ok) setReminders(await r2.json());
    if (r3.ok) setDiagnostico(await r3.json());
    if (r4.ok) { const b = await r4.json(); setBaby(b); setNuevoPeso(b.pesoKg ? String(b.pesoKg) : ""); }
  }

  async function loadRecords() {
    const res = await fetch("/api/records?babyId=" + babyId + "&" + dayRange(fechaSeleccionada));
    if (res.ok) { const recs: RecordItem[] = await res.json(); setRecords(recs); checkMedsAndLoadAI(recs); }
  }

  async function loadStats() {
    const res = await fetch("/api/stats?babyId=" + babyId + "&periodo=" + periodo + "&tz=" + encodeURIComponent(tz));
    if (res.ok) setStats(await res.json());
  }

  async function loadAI(meds: string[]) {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai-consulta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ medicamentos: meds }) });
      if (res.ok) { const d = await res.json(); setAiAnalisis(d.analisis); }
    } catch { /* sin API key o error de red */ }
    setLoadingAI(false);
  }

  function scheduleNotifications(rems: ReminderItem[]) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    rems.filter(r => r.isActive).forEach(r => {
      const hhmm = new Date(r.reminderTime).toISOString().slice(11, 16);
      const [hh, mm] = hhmm.split(":").map(Number);
      const now = new Date();
      const alertTime = new Date(now);
      alertTime.setHours(hh, mm - 10, 0, 0);
      const msUntil = alertTime.getTime() - now.getTime();
      if (msUntil > 0 && msUntil < 12 * 60 * 60 * 1000) {
        setTimeout(() => { if (Notification.permission === "granted") new Notification("BabyControl — " + r.title, { body: "Recordatorio en 10 minutos" }); }, msUntil);
      }
    });
  }

  async function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") scheduleNotifications(reminders);
  }

  async function guardar() {
    setSaving(true);
    const base = new Date(fechaSeleccionada + "T00:00:00");
    const [h, m] = horaRegistro.split(":");
    base.setHours(parseInt(h), parseInt(m), 0, 0);
    const body: Record<string, unknown> = { babyId, type: tipo, recordedAt: base.toISOString() };
    if (formulaMl) body.formulaMl = parseInt(formulaMl);
    if (pechoMin) body.pechoMin = parseInt(pechoMin);
    if (notes) body.notes = notes;
    const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setSavedMsg(true); setFormulaMl(""); setPechoMin(""); setNotes(""); setTimeout(() => setSavedMsg(false), 3000); loadAll(); loadRecords(); }
    setSaving(false);
  }

  async function eliminar(id: string) { setDeleting(id); await fetch("/api/records/" + id, { method: "DELETE" }); loadAll(); loadRecords(); setDeleting(null); }

  function iniciarEdicion(r: RecordItem) {
    setEditingId(r.id);
    setEditFormulaMl(r.formulaMl ? String(r.formulaMl) : "");
    setEditPechoMin(r.pechoMin ? String(r.pechoMin) : "");
    setEditNotes(r.notes ?? "");
    setEditHora(new Date(r.recordedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }));
  }

  async function actualizarRegistro(r: RecordItem) {
    setSavingEdit(true);
    const base = new Date(fechaSeleccionada + "T00:00:00");
    const [h, m] = editHora.split(":");
    base.setHours(parseInt(h), parseInt(m), 0, 0);
    await fetch("/api/records/" + r.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formulaMl: editFormulaMl ? parseInt(editFormulaMl) : null, pechoMin: editPechoMin ? parseInt(editPechoMin) : null, notes: editNotes || null, recordedAt: base.toISOString() }),
    });
    setEditingId(null);
    loadAll(); loadRecords();
    setSavingEdit(false);
  }

  async function guardarR() {
    if (!rTitle) return;
    setSavingR(true);
    const res = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, title: rTitle, reminderTime: rTime, reminderType: rType, isActive: true }) });
    if (res.ok) { setSavedR(true); setRTitle(""); setTimeout(() => setSavedR(false), 3000); loadAll(); }
    setSavingR(false);
  }

  async function eliminarR(id: string) { setDeletingR(id); await fetch("/api/reminders/" + id, { method: "DELETE" }); loadAll(); setDeletingR(null); }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      await fetch("/api/baby", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, fotoUrl: reader.result }) });
      loadAll(); setSubiendoFoto(false);
    };
    reader.readAsDataURL(file);
  }

  async function actualizarPeso() {
    if (!nuevoPeso) return;
    setSavingPeso(true);
    await fetch("/api/baby", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, pesoKg: parseFloat(nuevoPeso) }) });
    setSavedPeso(true); setTimeout(() => setSavedPeso(false), 3000); loadAll(); setSavingPeso(false);
  }

  const totalFormula = records.filter(r => r.type === "FORMULA").reduce((s, r) => s + (r.formulaMl ?? 0), 0);
  const totalPipi = records.filter(r => r.type === "PANAL_PIPI").length;
  const totalPopo = records.filter(r => r.type === "PANAL_POPO").length;
  const totalTomas = records.filter(r => r.type === "FORMULA" || r.type === "PECHO").length;
  const tipoActual = TIPOS.find(t => t.value === tipo);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-purple-400 text-xl">←</button>
          <label className="cursor-pointer relative">
            {baby?.fotoUrl ? <img src={baby.fotoUrl} alt={baby.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-300" /> : <div className="w-12 h-12 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-xl">👶</div>}
            <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
            {subiendoFoto && <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center text-xs">...</div>}
          </label>
          <div>
            <h1 className="text-xl font-bold text-purple-600">{baby?.name ?? "Bebe"}</h1>
            {diagnostico && <p className="text-xs text-slate-400">{diagnostico.bebe.edadTexto} · {diagnostico.bebe.pesoKg} kg</p>}
          </div>
        </div>
        {diagnostico && diagnostico.alertasCriticas.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">ALERTA</span>}
      </div>
      {diagnostico?.alertasCriticas.map((a, i) => <div key={i} className="mx-4 mt-3 bg-red-100 border-2 border-red-400 rounded-3xl p-4 flex gap-3"><span className="text-2xl">🚨</span><p className="text-sm text-red-800 font-semibold">{a}</p></div>)}
      <div className="px-4 pt-3 grid grid-cols-4 gap-2">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-purple-100"><p className="text-xl font-bold text-purple-600">{totalTomas}</p><p className="text-xs text-slate-500">Tomas</p></div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-blue-100"><p className="text-xl font-bold text-blue-600">{totalFormula}</p><p className="text-xs text-slate-500">ml</p></div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-yellow-100"><p className="text-xl font-bold text-yellow-600">{totalPipi}</p><p className="text-xs text-slate-500">Pipí</p></div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-amber-100"><p className="text-xl font-bold text-amber-600">{totalPopo}</p><p className="text-xs text-slate-500">Popó</p></div>
      </div>
      <div className="px-4 pt-3 grid grid-cols-5 gap-1">
        {(["inicio","registro","estadisticas","recordatorios","perfil"] as Seccion[]).map((s, i) => {
          const labels = ["Inicio","Registrar","Stats","Avisos","Perfil"];
          const colors = ["bg-purple-500","bg-blue-500","bg-indigo-500","bg-pink-500","bg-green-500"];
          return <button key={s} onClick={() => setSeccion(s)} className={"py-2 rounded-2xl font-semibold text-xs " + (seccion === s ? colors[i] + " text-white shadow-md" : "bg-white text-slate-600 border")}>{labels[i]}</button>;
        })}
      </div>
      <div className="px-4 pt-3 pb-20 space-y-4">

        {seccion === "inicio" && <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border p-4">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => { const d = new Date(fechaSeleccionada); d.setDate(d.getDate()-1); setFechaSeleccionada(d.toISOString().slice(0,10)); }} className="text-2xl text-purple-400 px-2">‹</button>
              <input type="date" value={fechaSeleccionada} onChange={e => setFechaSeleccionada(e.target.value)} max={hoyStr} className="text-sm font-semibold text-slate-800 border-2 border-purple-300 rounded-2xl px-3 py-2 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 w-full text-center" />
              <button onClick={() => { if (!esHoy) { const d = new Date(fechaSeleccionada); d.setDate(d.getDate()+1); const n = d.toISOString().slice(0,10); if (n <= hoyStr) setFechaSeleccionada(n); }}} className={"text-2xl px-2 " + (esHoy ? "text-slate-200" : "text-purple-400")}>›</button>
            </div>
          </div>
          {esHoy && diagnostico && (diagnostico.alertas.length > 0 || diagnostico.positivos.length > 0) && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-bold text-slate-700">Diagnóstico de hoy</h2>
            <div className="bg-slate-50 rounded-2xl p-3 text-sm text-slate-600 space-y-1">
              <p>Meta: <strong>{diagnostico.bebe.mlRecomendadosDia} ml</strong> en <strong>{diagnostico.bebe.tomasMinDia}-{diagnostico.bebe.tomasMaxDia} tomas</strong></p>
              <p>Por toma: <strong>{diagnostico.bebe.mlMinPorToma}-{diagnostico.bebe.mlMaxPorToma} ml</strong></p>
            </div>
            {diagnostico.alertas.map((a, i) => <div key={i} className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex gap-2"><span>⚠️</span><p className="text-sm text-orange-800">{a}</p></div>)}
            {diagnostico.positivos.map((p, i) => <div key={i} className="bg-green-50 border border-green-200 rounded-2xl p-3 flex gap-2"><span>✅</span><p className="text-sm text-green-800">{p}</p></div>)}
            {loadingAI && <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex gap-2 items-center"><span className="text-lg">🤖</span><p className="text-sm text-purple-600 italic">Analizando medicamentos con IA...</p></div>}
            {aiAnalisis && !loadingAI && <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2"><div className="flex items-center gap-2"><span className="text-lg">🤖</span><p className="text-sm font-bold text-purple-800">Análisis con IA</p></div><p className="text-sm text-purple-700 leading-relaxed">{aiAnalisis}</p></div>}
          </div>}
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-bold text-slate-700">{esHoy ? "Registros de hoy" : "Registros del " + new Date(fechaSeleccionada + "T12:00:00").toLocaleDateString("es-MX", {day:"numeric",month:"long"})}</h2>
            {records.length === 0 ? <div className="text-center py-6"><p className="text-4xl mb-2">👶</p><p className="text-slate-400 text-sm">Sin registros este día</p>{esHoy && <button onClick={() => setSeccion("registro")} className="mt-3 bg-blue-500 text-white px-5 py-2 rounded-2xl text-sm font-semibold">Registrar ahora</button>}</div>
            : <div className="space-y-2">{records.map(r => { const t = TIPOS.find(x => x.value === r.type); const isEditing = editingId === r.id; return <div key={r.id} className={"rounded-2xl border p-3 " + (t?.color ?? "bg-slate-50")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="text-2xl">{t?.emoji}</span><p className="font-semibold text-sm">{t?.label ?? r.type}</p></div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs opacity-70">{new Date(r.recordedAt).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</p>
                    <button onClick={() => isEditing ? setEditingId(null) : iniciarEdicion(r)} className="text-sm px-1 opacity-60 hover:opacity-100">{isEditing ? "✕" : "✏️"}</button>
                    <button onClick={() => eliminar(r.id)} disabled={deleting === r.id} className="text-red-400 text-sm">{deleting === r.id ? "..." : "🗑️"}</button>
                  </div>
                </div>
                {!isEditing && <div className="mt-1 ml-8">
                  {r.formulaMl ? <p className="text-xs opacity-80">{r.formulaMl} ml</p> : null}
                  {r.pechoMin ? <p className="text-xs opacity-80">{r.pechoMin} min</p> : null}
                  {r.notes ? <p className="text-xs opacity-80 italic">{r.notes}</p> : null}
                </div>}
                {isEditing && <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1"><p className="text-xs font-semibold opacity-60 mb-1">Hora</p><input type="time" value={editHora} onChange={e => setEditHora(e.target.value)} className="w-full border border-current border-opacity-30 rounded-xl px-3 py-2 text-sm bg-white bg-opacity-70 text-slate-800 focus:outline-none" /></div>
                    {(r.type === "FORMULA" || r.type === "MEDICAMENTO" || r.type === "SUPLEMENTO") && <div className="flex-1"><p className="text-xs font-semibold opacity-60 mb-1">ml</p><input type="number" value={editFormulaMl} onChange={e => setEditFormulaMl(e.target.value)} className="w-full border border-current border-opacity-30 rounded-xl px-3 py-2 text-sm bg-white bg-opacity-70 text-slate-800 focus:outline-none" /></div>}
                    {(r.type === "PECHO" || r.type === "SUENO") && <div className="flex-1"><p className="text-xs font-semibold opacity-60 mb-1">Min</p><input type="number" value={editPechoMin} onChange={e => setEditPechoMin(e.target.value)} className="w-full border border-current border-opacity-30 rounded-xl px-3 py-2 text-sm bg-white bg-opacity-70 text-slate-800 focus:outline-none" /></div>}
                  </div>
                  <input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas..." className="w-full border border-current border-opacity-30 rounded-xl px-3 py-2 text-sm bg-white bg-opacity-70 text-slate-800 focus:outline-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-white bg-opacity-50 border border-current border-opacity-30">Cancelar</button>
                    <button onClick={() => actualizarRegistro(r)} disabled={savingEdit} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-white bg-opacity-80 text-slate-700 disabled:opacity-50">{savingEdit ? "Guardando..." : "Guardar"}</button>
                  </div>
                </div>}
              </div>; })}</div>}
          </div>
        </div>}

        {seccion === "estadisticas" && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-700">Estadísticas</h2>
            <div className="flex gap-2">
              <button onClick={() => setPeriodo("semana")} className={"px-3 py-1 rounded-2xl text-xs font-semibold " + (periodo === "semana" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600")}>Semana</button>
              <button onClick={() => setPeriodo("mes")} className={"px-3 py-1 rounded-2xl text-xs font-semibold " + (periodo === "mes" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600")}>Mes</button>
            </div>
          </div>
          {stats && <>
            <div className="bg-indigo-50 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold text-indigo-800">Promedios diarios</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-blue-600">{stats.promedios.formula}</p><p className="text-xs text-slate-500">ml fórmula/día</p></div>
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-purple-600">{stats.promedios.tomas}</p><p className="text-xs text-slate-500">tomas/día</p></div>
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-yellow-600">{stats.promedios.pipi}</p><p className="text-xs text-slate-500">pañales pipí/día</p></div>
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-amber-600">{stats.promedios.popo}</p><p className="text-xs text-slate-500">pañales popó/día</p></div>
                {stats.promedios.sueno > 0 && <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-indigo-600">{stats.promedios.sueno}</p><p className="text-xs text-slate-500">min sueño/día</p></div>}
                {stats.promedios.medicamentos > 0 && <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-red-600">{stats.promedios.medicamentos}</p><p className="text-xs text-slate-500">medicamentos/día</p></div>}
                {stats.promedios.suplementos > 0 && <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-teal-600">{stats.promedios.suplementos}</p><p className="text-xs text-slate-500">suplementos/día</p></div>}
              </div>
            </div>
            <div className="space-y-2">{stats.dias.map((d, i) => <div key={i} className="bg-slate-50 rounded-2xl p-3">
              <p className="text-xs font-bold text-slate-600 mb-2">{d.fecha}</p>
              <div className="flex gap-2 flex-wrap">
                {d.formula > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-xl">🍼 {d.formula} ml</span>}
                {d.tomas > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-xl">Tomas: {d.tomas}</span>}
                {d.pipi > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-xl">💧 {d.pipi}</span>}
                {d.popo > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-xl">💩 {d.popo}</span>}
                {d.sueno > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-xl">😴 {d.sueno} min</span>}
                {d.medicamentos > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-xl">💊 {d.medicamentos}</span>}
                {d.suplementos > 0 && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-xl">🧴 {d.suplementos}</span>}
              </div>
            </div>)}</div>
            <p className="text-xs text-slate-400 text-center">{stats.totalRegistros} registros en este periodo</p>
          </>}
        </div>}

        {seccion === "registro" && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-700">Nuevo registro</h2>
          <div className="grid grid-cols-2 gap-3">{TIPOS.map(t => <button key={t.value} onClick={() => setTipo(t.value)} className={"p-4 rounded-2xl border-2 text-left transition-all " + (tipo === t.value ? t.color + " border-current shadow-md" : "bg-slate-50 border-slate-200 text-slate-600")}><p className="text-3xl mb-1">{t.emoji}</p><p className="font-semibold text-sm">{t.label}</p></button>)}</div>
          <div><label className="text-sm font-semibold text-purple-700 block mb-2">Hora</label><input type="time" value={horaRegistro} onChange={e => setHoraRegistro(e.target.value)} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
          {tipo === "FORMULA" && <div><label className="text-sm font-semibold text-purple-700 block mb-2">Mililitros</label><div className="flex gap-2 flex-wrap mb-2">{[30,60,90,120,150,180].map(ml => <button key={ml} onClick={() => setFormulaMl(String(ml))} className={"px-4 py-2 rounded-2xl border-2 font-semibold text-sm " + (formulaMl === String(ml) ? "bg-blue-500 text-white border-blue-500" : "bg-white border-slate-200 text-slate-600")}>{ml}</button>)}</div><input type="number" value={formulaMl} onChange={e => setFormulaMl(e.target.value)} placeholder="Otra cantidad" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
          {(tipo === "PECHO" || tipo === "SUENO") && <div><label className="text-sm font-semibold text-purple-700 block mb-2">Minutos</label><div className="flex gap-2 flex-wrap mb-2">{[5,10,15,20,30,60].map(min => <button key={min} onClick={() => setPechoMin(String(min))} className={"px-4 py-2 rounded-2xl border-2 font-semibold text-sm " + (pechoMin === String(min) ? "bg-pink-500 text-white border-pink-500" : "bg-white border-slate-200 text-slate-600")}>{min}</button>)}</div><input type="number" value={pechoMin} onChange={e => setPechoMin(e.target.value)} placeholder="Otros minutos" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
          {(tipo === "MEDICAMENTO" || tipo === "SUPLEMENTO") && <div><label className="text-sm font-semibold text-purple-700 block mb-2">{tipo === "MEDICAMENTO" ? "Nombre y dosis" : "Nombre del suplemento"}</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder={tipo === "MEDICAMENTO" ? "Ej: Paracetamol 2.5ml" : "Ej: Vitamina D 400 UI"} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
          {tipo !== "MEDICAMENTO" && tipo !== "SUPLEMENTO" && <div><label className="text-sm font-semibold text-purple-700 block mb-2">Notas opcionales</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 resize-none" rows={2} /></div>}
          {savedMsg && <div className="bg-green-100 border border-green-300 rounded-2xl p-3 text-center"><p className="text-green-700 font-semibold">Guardado correctamente</p></div>}
          <button onClick={guardar} disabled={saving} className="w-full py-4 rounded-2xl font-bold text-lg bg-blue-500 text-white shadow-md disabled:opacity-50">{saving ? "Guardando..." : "Guardar " + (tipoActual?.label ?? "")}</button>
        </div>}

        {seccion === "recordatorios" && <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">Nuevo recordatorio</h2>
            <input value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="Ej: Toma de las 8am" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-purple-700 block mb-1">Hora</label><input type="time" value={rTime} onChange={e => setRTime(e.target.value)} className="w-full border-2 border-purple-300 rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
              <div><label className="text-xs font-semibold text-purple-700 block mb-1">Tipo</label><select value={rType} onChange={e => setRType(e.target.value)} className="w-full border-2 border-purple-300 rounded-2xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"><option value="FORMULA">Fórmula</option><option value="TEMPERATURA">Temperatura</option><option value="MEDICINA">Medicina</option><option value="PESO">Peso</option><option value="SUPLEMENTO">Suplemento</option></select></div>
            </div>
            {savedR && <div className="bg-green-100 border border-green-300 rounded-2xl p-3 text-center"><p className="text-green-700 font-semibold">Recordatorio guardado</p></div>}
            <button onClick={guardarR} disabled={savingR || !rTitle} className="w-full py-4 rounded-2xl font-bold text-lg bg-pink-500 text-white shadow-md disabled:opacity-50">{savingR ? "Guardando..." : "Guardar recordatorio"}</button>
          </div>
          {notifPermission !== "granted" && <div className="bg-pink-50 rounded-3xl border border-pink-200 p-4 flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div className="flex-1"><p className="text-sm font-semibold text-pink-800">Activar alertas</p><p className="text-xs text-pink-600">Alerta 10 min antes de cada recordatorio</p></div>
            <button onClick={requestNotifPermission} className="bg-pink-500 text-white text-xs font-bold px-4 py-2 rounded-2xl">Activar</button>
          </div>}
          {notifPermission === "granted" && <div className="bg-green-50 rounded-3xl border border-green-200 p-3 flex items-center gap-2"><span>✅</span><p className="text-sm text-green-700">Alertas activas — aviso 10 min antes</p></div>}
          {reminders.length > 0 && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-bold text-slate-700">Mis recordatorios</h2>
            {reminders.map(r => {
              const isExpanded = expandedReminderId === r.id;
              const timeStr = new Date(r.reminderTime).toISOString().slice(11, 16);
              return <div key={r.id} className="rounded-2xl border border-pink-200 overflow-hidden">
                <button onClick={() => setExpandedReminderId(isExpanded ? null : r.id)} className="w-full bg-pink-50 p-4 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3"><span className="text-2xl">🔔</span><div><p className="font-semibold text-slate-700 text-sm">{r.title}</p><p className="text-xs text-pink-600">{r.reminderType} · {r.isActive ? "Activo" : "Inactivo"}</p></div></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                    <button onClick={e => { e.stopPropagation(); eliminarR(r.id); }} disabled={deletingR === r.id} className="text-red-400 text-sm px-2 py-1 rounded-xl">{deletingR === r.id ? "..." : "🗑️"}</button>
                  </div>
                </button>
                {isExpanded && <div className="bg-white border-t border-pink-100 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2"><span>🕐</span><p className="text-sm font-bold text-pink-800">Hora: {timeStr}</p></div>
                  <p className="text-xs text-pink-500">La alerta llega 10 minutos antes ({timeStr})</p>
                </div>}
              </div>;
            })}
          </div>}
        </div>}

        {seccion === "perfil" && <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">Actualizar peso</h2>
            <p className="text-sm text-slate-500">Peso actual: <strong>{baby?.pesoKg ?? "No registrado"} kg</strong></p>
            <div className="flex gap-3">
              <input type="number" step="0.1" value={nuevoPeso} onChange={e => setNuevoPeso(e.target.value)} placeholder="Ej: 4.5" className="flex-1 border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" />
              <button onClick={actualizarPeso} disabled={savingPeso} className="bg-green-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">{savingPeso ? "..." : "Guardar"}</button>
            </div>
            {savedPeso && <p className="text-green-600 text-sm text-center">Peso actualizado</p>}
          </div>
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-bold text-slate-700">Foto del bebé</h2>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                {baby?.fotoUrl ? <img src={baby.fotoUrl} alt={baby.name} className="w-20 h-20 rounded-full object-cover border-2 border-purple-300" /> : <div className="w-20 h-20 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-3xl">👶</div>}
                <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
              </label>
              <div><p className="text-sm text-slate-600">Toca la foto para cambiarla</p>{subiendoFoto && <p className="text-xs text-purple-500">Subiendo...</p>}</div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
