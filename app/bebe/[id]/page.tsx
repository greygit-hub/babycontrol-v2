"use client";
import * as React from "react";
import { getRangoEstimulacion, getRangoAlimentacion, getRecomendacionPanal } from "@/lib/guias";
import { useRouter, useParams } from "next/navigation";

const TIPOS = [
  { value: "FORMULA", emoji: "🍼", label: "Fórmula", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { value: "PECHO", emoji: "🤱", label: "Pecho", color: "bg-pink-100 border-pink-300 text-pink-800" },
  { value: "PANAL", emoji: "🧷", label: "Pañal", color: "bg-yellow-100 border-yellow-300 text-yellow-800" },
  { value: "SUENO", emoji: "😴", label: "Sueño", color: "bg-purple-100 border-purple-300 text-purple-800" },
  { value: "PESO", emoji: "⚖️", label: "Peso", color: "bg-green-100 border-green-300 text-green-800" },
  { value: "TEMPERATURA", emoji: "🌡️", label: "Temperatura", color: "bg-orange-100 border-orange-300 text-orange-800" },
  { value: "MEDICAMENTO", emoji: "💊", label: "Medicamento", color: "bg-red-100 border-red-300 text-red-800" },
  { value: "SUPLEMENTO", emoji: "🧴", label: "Suplemento", color: "bg-teal-100 border-teal-300 text-teal-800" },
];

type RecordItem = { id: string; type: string; formulaMl: number | null; pechoMin: number | null; notes: string | null; recordedAt: string };
type Diagnostico = { bebe: { pesoKg: number; edadTexto: string; mlRecomendadosDia: number; mlMinPorToma: number; mlMaxPorToma: number; tomasMinDia: number; tomasMaxDia: number; pipiMinimo: number }; alertasCriticas: string[]; alertas: string[]; positivos: string[] };
type BabyInfo = { id: string; name: string; fotoUrl: string | null; pesoKg: number | null; estaturaCmd: number | null; birthDate: string | null };
type GrowthEntry = { id: string; fecha: string; pesoKg: number | null; estaturaCmd: number | null };
type ReminderItem = { id: string; title: string; reminderType: string; isActive: boolean; reminderTime: string };
type DiaStats = { fecha: string; panales: number; formula: number; tomas: number; pechoTomas: number; formulaTomas: number; pipi: number; popo: number; sueno: number; suenoDay: number; suenoNight: number; suenoDespierto: number; medicamentos: number; suplementos: number };
type StatsData = { dias: DiaStats[]; promedios: { panales: number; formula: number; tomas: number; pechoTomas: number; formulaTomas: number; pipi: number; popo: number; sueno: number; suenoDay: number; suenoNight: number; suenoDespierto: number; medicamentos: number; suplementos: number }; totalRegistros: number };
type MedAdmin = { id: string; administradoEn: string; notas: string | null };
type Tratamiento = { id: string; nombre: string; dosis: string; frecuenciaHoras: number; diasTotal: number; fechaInicio: string; activo: boolean; administraciones: MedAdmin[] };
type VacunaRecord = { id: string; nombre: string; folio: string | null; aplicadaEn: string | null; clinica: string | null; lote: string | null };
type DiagnosticoHistorialEntry = { id: string; fecha: string; alertasCriticas: string[]; alertas: string[]; positivos: string[] };
type Seccion = "inicio" | "registro" | "estadisticas" | "diagnostico" | "recordatorios" | "guias" | "lactancia" | "vacunas" | "perfil";

const PREGUNTAS_LACTANCIA = [
  { id: 1, texto: "¿Cuántas tomas al día está dando?", opciones: [{ label: "Menos de 6", valor: 0 }, { label: "6-8 tomas", valor: 1 }, { label: "Más de 8", valor: 2 }] },
  { id: 2, texto: "¿Tu bebé termina satisfecho después de cada toma?", opciones: [{ label: "No", valor: 0 }, { label: "A veces", valor: 1 }, { label: "Sí", valor: 2 }] },
  { id: 3, texto: "¿Cuántos pañales mojados hace al día?", opciones: [{ label: "Menos de 4", valor: 0 }, { label: "4-6 pañales", valor: 1 }, { label: "Más de 6", valor: 2 }] },
  { id: 4, texto: "¿Sientes tus pechos llenos antes de las tomas?", opciones: [{ label: "No", valor: 0 }, { label: "A veces", valor: 1 }, { label: "Sí", valor: 2 }] },
  { id: 5, texto: "¿Estás tomando suficiente agua?", opciones: [{ label: "Menos de 1L", valor: 0 }, { label: "1-2 litros", valor: 1 }, { label: "Más de 2L", valor: 2 }] },
  { id: 6, texto: "¿Cuántas horas duermes seguidas?", opciones: [{ label: "Menos de 3h", valor: 0 }, { label: "3-5 horas", valor: 1 }, { label: "Más de 5h", valor: 2 }] },
  { id: 7, texto: "¿Tienes estrés o ansiedad frecuente?", opciones: [{ label: "Mucho", valor: 0 }, { label: "Regular", valor: 1 }, { label: "Poco o nada", valor: 2 }] },
  { id: 8, texto: "¿Estás tomando algún medicamento?", opciones: [{ label: "Sí", valor: 0 }, { label: "No", valor: 2 }] },
  { id: 9, texto: "¿El bebé tiene buen agarre al pecho?", opciones: [{ label: "No", valor: 0 }, { label: "No sé", valor: 1 }, { label: "Sí", valor: 2 }] },
  { id: 10, texto: "¿Has notado disminución de leche recientemente?", opciones: [{ label: "Sí", valor: 0 }, { label: "No", valor: 2 }] },
];

function calcularResultadoLactancia(respuestas: Record<number, number>) {
  const puntaje = Object.values(respuestas).reduce((s, v) => s + v, 0);
  if (puntaje >= 16) return {
    nivel: "verde", emoji: "🟢", puntaje,
    titulo: "Producción adecuada",
    subtitulo: "¡Vas muy bien! Tu lactancia está en buen camino.",
    color: "emerald",
    tips: [
      "Continúa con tomas a demanda, mínimo 8 al día",
      "Mantén tu hidratación: 2.5L de agua al día",
      "Incluye alimentos galactogénicos: avena, hinojo, fenogreco",
      "El contacto piel con piel refuerza la producción",
      "La constancia es clave — ¡sigue así!",
    ],
  };
  if (puntaje >= 10) return {
    nivel: "amarillo", emoji: "🟡", puntaje,
    titulo: "Producción en riesgo",
    subtitulo: "Hay señales de alerta. Con algunos cambios puedes mejorar tu producción.",
    color: "yellow",
    tips: [
      "Ofrece el pecho cada 2-3 horas, mínimo 8-10 veces al día",
      "Hidratación prioritaria: mínimo 2.5L de agua al día",
      "Alimentos galactogénicos: avena, fenogreco, hinojo, cebada malteada",
      "Realiza extracción entre tomas para estimular más producción",
      "Revisa el agarre: el bebé debe abarcar la areola completa, no solo el pezón",
      "Técnicas de relajación: respiración profunda, 5 min de meditación",
      "Duerme cuando el bebé duerme — el descanso es producción",
    ],
  };
  return {
    nivel: "rojo", emoji: "🔴", puntaje,
    titulo: "Producción baja",
    subtitulo: "Tu cuerpo necesita apoyo. Te recomendamos actuar pronto.",
    color: "red",
    tips: [
      "Consulta a una asesora de lactancia certificada o tu médico lo antes posible",
      "Aumenta tomas a demanda: mínimo 10-12 veces al día",
      "Hidratación intensa: apunta a 3L de agua al día",
      "Extracción inmediatamente después de cada toma para estimular producción",
      "Consulta si algún medicamento puede estar afectando la leche",
      "Contacto piel con piel constante activa las hormonas de la lactancia",
      "Con apoyo profesional muchas mamás recuperan la producción — no estás sola",
    ],
  };
}

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
  const [nuevaEstatura, setNuevaEstatura] = React.useState("");
  const [growthHistory, setGrowthHistory] = React.useState<GrowthEntry[]>([]);
  const [lactPregunta, setLactPregunta] = React.useState(0);
  const [lactRespuestas, setLactRespuestas] = React.useState<Record<number, number>>({});
  const [lactCompleto, setLactCompleto] = React.useState(false);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [editNombre, setEditNombre] = React.useState("");
  const [editNacimiento, setEditNacimiento] = React.useState("");
  const [savingPerfil, setSavingPerfil] = React.useState(false);
  const [savedPerfil, setSavedPerfil] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editFormulaMl, setEditFormulaMl] = React.useState("");
  const [editPechoMin, setEditPechoMin] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editHora, setEditHora] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [expandedReminderId, setExpandedReminderId] = React.useState<string | null>(null);
  const [aiAnalisis, setAiAnalisis] = React.useState<string | null>(null);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [notifPermission, setNotifPermission] = React.useState("default");
  const [guiaTab, setGuiaTab] = React.useState<"estimulacion" | "alimentacion" | "panal">("estimulacion");
  const [checks, setChecks] = React.useState<string[]>([]);
  const [loadingChecks, setLoadingChecks] = React.useState(false);
  const [nota, setNota] = React.useState("");
  const [savingNota, setSavingNota] = React.useState(false);
  const notaTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tratamientos, setTratamientos] = React.useState<Tratamiento[]>([]);
  const [showNuevoTrat, setShowNuevoTrat] = React.useState(false);
  const [tNombre, setTNombre] = React.useState("");
  const [tDosis, setTDosis] = React.useState("");
  const [tFrecuencia, setTFrecuencia] = React.useState("8");
  const [tDias, setTDias] = React.useState("5");
  const [tFechaInicio, setTFechaInicio] = React.useState(hoyStr);
  const [savingTrat, setSavingTrat] = React.useState(false);
  const [registrandoDosis, setRegistrandoDosis] = React.useState<string | null>(null);
  const [suplementos, setSupl] = React.useState<Tratamiento[]>([]);
  const [showNuevoSupl, setShowNuevoSupl] = React.useState(false);
  const [sNombre, setSNombre] = React.useState("");
  const [sDosis, setSDosis] = React.useState("");
  const [sFrecuencia, setSFrecuencia] = React.useState("24");
  const [sDias, setSDias] = React.useState("30");
  const [sFechaInicio, setSFechaInicio] = React.useState(hoyStr);
  const [savingSupl, setSavingSupl] = React.useState(false);
  const [registrandoDosisSup, setRegistrandoDosisSup] = React.useState<string | null>(null);
  const [vacunas, setVacunas] = React.useState<VacunaRecord[]>([]);
  const [vacunaForm, setVacunaForm] = React.useState<{ nombre: string; folio: string; aplicadaEn: string; clinica: string; lote: string } | null>(null);
  const [savingVacuna, setSavingVacuna] = React.useState(false);
  const [historial, setHistorial] = React.useState<DiagnosticoHistorialEntry[]>([]);
  const [suenoInicio, setSuenoInicio] = React.useState("22:00");
  const [suenoFin, setSuenoFin] = React.useState("06:00");
  const [panalPipi, setPanalPipi] = React.useState(true);
  const [panalPopo, setPanalPopo] = React.useState(false);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set());
  const notifiedDoses = React.useRef<Set<string>>(new Set());

  React.useEffect(() => { loadAll(); loadTratamientos(); loadSuplementos(); loadVacunas(); loadHistorial(); loadGrowthHistory(); }, [babyId]);
  React.useEffect(() => { loadRecords(); }, [fechaSeleccionada]);
  React.useEffect(() => { loadStats(); }, [periodo, babyId]);
  React.useEffect(() => { if (typeof Notification !== "undefined") setNotifPermission(Notification.permission); }, []);
  React.useEffect(() => { scheduleNotifications(reminders); }, [reminders]);
  React.useEffect(() => { checkDoseAlerts(tratamientos, suplementos); }, [tratamientos, suplementos, notifPermission]);

  function dayRange(dateStr: string) {
    const s = new Date(dateStr + "T00:00:00").toISOString();
    const e = new Date(dateStr + "T23:59:59.999").toISOString();
    return "start=" + s + "&end=" + e;
  }

  function checkMedsAndLoadAI(recs: RecordItem[]) {
    const items = recs.filter(r => r.type === "MEDICAMENTO" || r.type === "SUPLEMENTO");
    if (items.length === 0) { setAiAnalisis(null); return; }
    const meds = items.map(r => {
      const label = r.type === "MEDICAMENTO" ? "Medicamento" : "Suplemento";
      return r.notes ? `${label}: ${r.notes}` : label;
    });
    loadAI(meds);
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
    if (r3.ok) { const diag = await r3.json(); setDiagnostico(diag); if (diag && (diag.alertas?.length > 0 || diag.positivos?.length > 0 || diag.alertasCriticas?.length > 0)) { fetch("/api/diagnostico-historial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, fecha: hoyStr, alertasCriticas: diag.alertasCriticas ?? [], alertas: diag.alertas ?? [], positivos: diag.positivos ?? [] }) }).then(() => loadHistorial()); } }
    if (r4.ok) { const b = await r4.json(); setBaby(b); setNuevoPeso(b.pesoKg ? String(b.pesoKg) : ""); setNuevaEstatura(b.estaturaCmd ? String(b.estaturaCmd) : ""); setEditNombre(b.name ?? ""); setEditNacimiento(b.birthDate ? new Date(b.birthDate).toISOString().slice(0,10) : ""); }
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
    setAiError(null);
    setAiAnalisis(null);
    try {
      const res = await fetch("/api/ai-consulta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ medicamentos: meds }) });
      if (res.ok) {
        const d = await res.json();
        if (d.analisis) setAiAnalisis(d.analisis);
        else setAiError(d.errorHint ?? "No se recibió respuesta del servidor de IA.");
      } else { setAiError("Error al contactar el servidor (" + res.status + ")."); }
    } catch { setAiError("No se pudo conectar con el servidor de IA."); }
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
    if (tipo === "PANAL" && !panalPipi && !panalPopo) return;
    setSaving(true);
    const base = new Date(fechaSeleccionada + "T00:00:00");
    const [h, m] = horaRegistro.split(":");
    base.setHours(parseInt(h), parseInt(m), 0, 0);
    const recordedAtStr = base.toISOString();

    if (tipo === "PANAL") {
      const posts: Promise<Response>[] = [];
      if (panalPipi) posts.push(fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, type: "PANAL_PIPI", recordedAt: recordedAtStr, ...(notes ? { notes } : {}) }) }));
      if (panalPopo) posts.push(fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, type: "PANAL_POPO", recordedAt: recordedAtStr, ...(notes ? { notes } : {}) }) }));
      await Promise.all(posts);
      setSavedMsg(true); setNotes(""); setTimeout(() => setSavedMsg(false), 3000); loadAll(); loadRecords();
      setSaving(false);
      return;
    }

    const body: Record<string, unknown> = { babyId, type: tipo };
    let finalRecordedAt = recordedAtStr;
    if (tipo === "SUENO" && suenoInicio && suenoFin) {
      const [sh, sm] = suenoInicio.split(":").map(Number);
      const [eh, em] = suenoFin.split(":").map(Number);
      let minutos = (eh * 60 + em) - (sh * 60 + sm);
      if (minutos <= 0) minutos += 1440;
      body.pechoMin = minutos;
      const startBase = new Date(fechaSeleccionada + "T00:00:00");
      startBase.setHours(sh, sm, 0, 0);
      finalRecordedAt = startBase.toISOString();
    } else {
      if (formulaMl) body.formulaMl = parseInt(formulaMl);
      if (pechoMin) body.pechoMin = parseInt(pechoMin);
    }
    body.recordedAt = finalRecordedAt;
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

  async function actualizarPerfil() {
    if (!editNombre.trim()) return;
    setSavingPerfil(true);
    await fetch("/api/baby", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, name: editNombre.trim(), ...(editNacimiento ? { birthDate: editNacimiento } : {}) }) });
    setSavedPerfil(true); setTimeout(() => setSavedPerfil(false), 3000); loadAll(); setSavingPerfil(false);
  }

  async function loadGrowthHistory() {
    const res = await fetch("/api/growth-record?babyId=" + babyId);
    if (res.ok) setGrowthHistory(await res.json());
  }

  async function guardarMedicion() {
    if (!nuevoPeso && !nuevaEstatura) return;
    setSavingPeso(true);
    const updates: Record<string, unknown> = { babyId };
    const growthData: Record<string, unknown> = { babyId };
    if (nuevoPeso) { updates.pesoKg = parseFloat(nuevoPeso); growthData.pesoKg = parseFloat(nuevoPeso); }
    if (nuevaEstatura) { updates.estaturaCmd = parseFloat(nuevaEstatura); growthData.estaturaCmd = parseFloat(nuevaEstatura); }
    await Promise.all([
      fetch("/api/baby", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) }),
      fetch("/api/growth-record", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(growthData) }),
    ]);
    setSavedPeso(true); setTimeout(() => setSavedPeso(false), 3000); loadAll(); loadGrowthHistory(); setSavingPeso(false);
  }

  async function eliminarGrowthRecord(id: string) {
    await fetch("/api/growth-record", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadGrowthHistory();
  }

  function edadMeses(): number {
    if (!baby?.birthDate) return 0;
    const birth = new Date(baby.birthDate.slice(0, 10) + "T12:00:00");
    const now = new Date();
    let m = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) m--;
    return Math.max(0, m);
  }

  function rangoEdad(meses: number): string {
    if (meses < 3) return "0-3 meses";
    if (meses < 6) return "3-6 meses";
    if (meses < 9) return "6-9 meses";
    if (meses < 12) return "9-12 meses";
    if (meses < 24) return "12-24 meses";
    return "24+ meses";
  }

  async function loadChecks() {
    setLoadingChecks(true);
    const [r1, r2] = await Promise.all([
      fetch(`/api/estimulacion?babyId=${babyId}&fecha=${hoyStr}`),
      fetch(`/api/estimulacion/nota?babyId=${babyId}&fecha=${hoyStr}`),
    ]);
    if (r1.ok) setChecks(await r1.json());
    if (r2.ok) { const d = await r2.json(); setNota(d.nota ?? ""); }
    setLoadingChecks(false);
  }

  async function toggleCheck(actividad: string) {
    const r = await fetch("/api/estimulacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, fecha: hoyStr, actividad }) });
    if (r.ok) {
      const { checked } = await r.json();
      setChecks(prev => checked ? [...prev, actividad] : prev.filter(c => c !== actividad));
    }
  }

  function handleNotaChange(value: string) {
    setNota(value);
    if (notaTimerRef.current) clearTimeout(notaTimerRef.current);
    notaTimerRef.current = setTimeout(async () => {
      setSavingNota(true);
      await fetch("/api/estimulacion/nota", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ babyId, fecha: hoyStr, nota: value }) });
      setSavingNota(false);
    }, 800);
  }

  function minToHm(min: number): string {
    if (min <= 0) return "0 min";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  function calcTratStatus(t: Tratamiento) {
    const totalDosis = Math.ceil((t.diasTotal * 24) / t.frecuenciaHoras);
    const dosisDadas = t.administraciones.length;
    const dosisRestantes = Math.max(0, totalDosis - dosisDadas);
    const ahora = new Date();
    let proximaDosis: Date;
    if (dosisDadas === 0) {
      proximaDosis = new Date(t.fechaInicio);
    } else {
      const ult = new Date(t.administraciones[t.administraciones.length - 1].administradoEn);
      proximaDosis = new Date(ult.getTime() + t.frecuenciaHoras * 3600000);
    }
    const atrasada = proximaDosis < ahora && dosisRestantes > 0;
    const minHasta = Math.round((proximaDosis.getTime() - ahora.getTime()) / 60000);
    return { totalDosis, dosisDadas, dosisRestantes, proximaDosis, atrasada, minHasta, completado: dosisRestantes === 0 };
  }

  async function loadTratamientos() {
    const res = await fetch("/api/medicamento-tratamiento?babyId=" + babyId);
    if (res.ok) setTratamientos(await res.json());
  }

  async function crearTratamiento() {
    if (!tNombre || !tDosis || !tFrecuencia || !tDias) return;
    setSavingTrat(true);
    const res = await fetch("/api/medicamento-tratamiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, nombre: tNombre, dosis: tDosis, frecuenciaHoras: tFrecuencia, diasTotal: tDias, fechaInicio: tFechaInicio + "T00:00:00" }),
    });
    if (res.ok) {
      setShowNuevoTrat(false);
      setTNombre(""); setTDosis(""); setTFrecuencia("8"); setTDias("5"); setTFechaInicio(hoyStr);
      loadTratamientos();
    }
    setSavingTrat(false);
  }

  async function registrarDosis(tratId: string) {
    setRegistrandoDosis(tratId);
    await fetch("/api/medicamento-tratamiento/" + tratId + "/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    loadTratamientos();
    setRegistrandoDosis(null);
  }

  async function cerrarTratamiento(tratId: string) {
    await fetch("/api/medicamento-tratamiento", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tratId, activo: false }),
    });
    loadTratamientos();
  }

  async function loadSuplementos() {
    const res = await fetch("/api/suplemento-tratamiento?babyId=" + babyId);
    if (res.ok) setSupl(await res.json());
  }

  async function crearSuplemento() {
    if (!sNombre || !sDosis || !sFrecuencia || !sDias) return;
    setSavingSupl(true);
    const res = await fetch("/api/suplemento-tratamiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, nombre: sNombre, dosis: sDosis, frecuenciaHoras: sFrecuencia, diasTotal: sDias, fechaInicio: sFechaInicio + "T00:00:00" }),
    });
    if (res.ok) {
      setShowNuevoSupl(false);
      setSNombre(""); setSDosis(""); setSFrecuencia("24"); setSDias("30"); setSFechaInicio(hoyStr);
      loadSuplementos();
    }
    setSavingSupl(false);
  }

  async function registrarDosisSup(tratId: string) {
    setRegistrandoDosisSup(tratId);
    await fetch("/api/suplemento-tratamiento/" + tratId + "/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    loadSuplementos();
    setRegistrandoDosisSup(null);
  }

  async function cerrarSuplemento(tratId: string) {
    await fetch("/api/suplemento-tratamiento", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tratId, activo: false }),
    });
    loadSuplementos();
  }

  async function loadHistorial() {
    const res = await fetch("/api/diagnostico-historial?babyId=" + babyId);
    if (res.ok) setHistorial(await res.json());
  }

  function checkDoseAlerts(trats: Tratamiento[], supls: Tratamiento[]) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const allActivos = [...trats.filter(t => t.activo), ...supls.filter(t => t.activo)];
    allActivos.forEach(t => {
      const st = calcTratStatus(t);
      if (st.completado) return;
      const overdueKey = t.id + "_overdue";
      const upcomingKey = t.id + "_upcoming_" + Math.floor(Date.now() / 3600000);
      if (st.atrasada && !notifiedDoses.current.has(overdueKey)) {
        notifiedDoses.current.add(overdueKey);
        try { new Notification("BabyControl — Dosis atrasada 💊", { body: `${t.nombre}: ${t.dosis} — hace ${formatRetraso(st.minHasta)}`, icon: "/logo-babycontrol.png" }); } catch {}
      } else if (!st.atrasada && st.minHasta > 0 && st.minHasta <= 60 && !notifiedDoses.current.has(upcomingKey)) {
        notifiedDoses.current.add(upcomingKey);
        const msUntil = st.minHasta * 60000;
        setTimeout(() => {
          if (Notification.permission === "granted") {
            try { new Notification("BabyControl — Próxima dosis 💊", { body: `${t.nombre}: ${t.dosis} — en ${formatRetraso(st.minHasta)}`, icon: "/logo-babycontrol.png" }); } catch {}
          }
        }, msUntil);
      }
    });
  }

  async function loadVacunas() {
    const res = await fetch("/api/vacuna?babyId=" + babyId);
    if (res.ok) setVacunas(await res.json());
  }

  async function guardarVacuna() {
    if (!vacunaForm?.nombre) return;
    setSavingVacuna(true);
    await fetch("/api/vacuna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, ...vacunaForm, aplicadaEn: vacunaForm.aplicadaEn || undefined }),
    });
    setVacunaForm(null);
    loadVacunas();
    setSavingVacuna(false);
  }

  async function eliminarVacuna(id: string) {
    await fetch("/api/vacuna", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadVacunas();
  }

  function formatRetraso(min: number): string {
    const abs = Math.abs(min);
    if (abs < 60) return `${abs} min`;
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  function sleepRecByAge(meses: number): { min: number; max: number } {
    if (meses <= 3) return { min: 14 * 60, max: 17 * 60 };
    if (meses <= 11) return { min: 12 * 60, max: 15 * 60 };
    if (meses <= 23) return { min: 11 * 60, max: 14 * 60 };
    if (meses <= 59) return { min: 10 * 60, max: 13 * 60 };
    return { min: 9 * 60, max: 12 * 60 };
  }

  const VACUNAS_CALENDARIO: { nombre: string; edadMeses: number; etiqueta: string }[] = [
    { nombre: "BCG", edadMeses: 0, etiqueta: "Al nacer" },
    { nombre: "Hepatitis B (1a dosis)", edadMeses: 0, etiqueta: "Al nacer" },
    { nombre: "Hexavalente (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
    { nombre: "Rotavirus (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
    { nombre: "Neumococo (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
    { nombre: "Meningococo (1a dosis)", edadMeses: 2, etiqueta: "2 meses" },
    { nombre: "Hexavalente (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
    { nombre: "Rotavirus (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
    { nombre: "Neumococo (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
    { nombre: "Meningococo (2a dosis)", edadMeses: 4, etiqueta: "4 meses" },
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

  const totalFormula = records.filter(r => r.type === "FORMULA").reduce((s, r) => s + (r.formulaMl ?? 0), 0);
  const totalPipi = records.filter(r => r.type === "PANAL_PIPI").length;
  const totalPopo = records.filter(r => r.type === "PANAL_POPO").length;
  const totalTomas = records.filter(r => r.type === "FORMULA" || r.type === "PECHO").length;
  const tipoActual = TIPOS.find(t => t.value === tipo);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard")} className="text-purple-400 text-xl">←</button>
          <img src="/logo-babycontrol.png" alt="BabyControl" className="h-10 w-auto" />
          <span className="text-base font-bold text-purple-600">Baby Control</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="text-base font-bold text-purple-600">{baby?.name ?? "Bebe"}</h1>
            {diagnostico && <p className="text-xs text-slate-400">{diagnostico.bebe.edadTexto} · {diagnostico.bebe.pesoKg} kg{baby?.estaturaCmd ? ` · ${baby.estaturaCmd} cm` : ""}</p>}
          </div>
          <label className="cursor-pointer relative">
            {baby?.fotoUrl ? <img src={baby.fotoUrl} alt={baby?.name ?? "Bebe"} className="w-12 h-12 rounded-full object-cover border-2 border-purple-300" /> : <div className="w-12 h-12 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-xl">👶</div>}
            <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
            {subiendoFoto && <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center text-xs">...</div>}
          </label>
          {diagnostico && diagnostico.alertasCriticas.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">ALERTA</span>}
        </div>
      </div>
      {diagnostico?.alertasCriticas.filter(a => !dismissedAlerts.has("crit:" + a)).map((a, i) => <div key={i} className="mx-4 mt-3 bg-red-100 border-2 border-red-400 rounded-3xl p-4 flex gap-3 items-start"><span className="text-2xl">🚨</span><p className="text-sm text-red-800 font-semibold flex-1">{a}</p><button onClick={() => setDismissedAlerts(prev => new Set([...prev, "crit:" + a]))} className="text-xs text-red-500 font-bold border border-red-400 px-2 py-1 rounded-xl shrink-0">Aceptar</button></div>)}
      <div className="px-4 pt-3 grid grid-cols-4 gap-2">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-purple-100"><p className="text-xl font-bold text-purple-600">{totalTomas}</p><p className="text-xs text-slate-500">Tomas</p></div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-blue-100"><p className="text-xl font-bold text-blue-600">{totalFormula}</p><p className="text-xs text-slate-500">ml</p></div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-yellow-100"><p className="text-xl font-bold text-yellow-600">{totalPipi}</p><p className="text-xs text-slate-500">Pipí</p></div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-amber-100"><p className="text-xl font-bold text-amber-600">{totalPopo}</p><p className="text-xs text-slate-500">Popó</p></div>
      </div>
      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          {([
            { s: "inicio", label: "Inicio", color: "bg-purple-500" },
            { s: "registro", label: "Registrar", color: "bg-blue-500" },
            { s: "estadisticas", label: "Estadísticas", color: "bg-indigo-500" },
            { s: "diagnostico", label: "Diagnóstico", color: "bg-orange-500" },
            { s: "recordatorios", label: "Avisos", color: "bg-pink-500" },
            { s: "guias", label: "Guías ✨", color: "bg-emerald-500", extra: loadChecks },
            { s: "lactancia", label: "Mi Lactancia 🤱", color: "bg-pink-500" },
            { s: "vacunas", label: "Vacunas 💉", color: "bg-cyan-500" },
            { s: "perfil", label: "Perfil", color: "bg-green-500" },
          ] as { s: Seccion; label: string; color: string; extra?: () => void }[]).map(item => (
            <button key={item.s} onClick={() => { setSeccion(item.s); item.extra?.(); }}
              className={"py-2 px-4 rounded-2xl font-semibold text-xs whitespace-nowrap " + (seccion === item.s ? item.color + " text-white shadow-md" : "bg-white text-slate-600 border")}>
              {item.label}
            </button>
          ))}
        </div>
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
          {esHoy && (diagnostico?.alertas.length ?? 0) + (diagnostico?.positivos.length ?? 0) > 0 && <button onClick={() => setSeccion("diagnostico")} className="w-full bg-orange-50 border border-orange-200 rounded-3xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-2xl">🩺</span><div className="text-left"><p className="text-sm font-bold text-orange-800">Ver diagnóstico de hoy</p><p className="text-xs text-orange-600">{diagnostico!.alertas.length} avisos · {diagnostico!.positivos.length} positivos</p></div></div><span className="text-orange-400 text-lg">›</span></button>}
          {(() => {
            const medActivos = tratamientos.filter(t => t.activo);
            const suplActivos = suplementos.filter(t => t.activo);
            if (medActivos.length === 0 && suplActivos.length === 0) return null;
            return (
              <div className="space-y-2">
                {medActivos.map(t => { const st = calcTratStatus(t); return (
                  <div key={t.id} className={"rounded-2xl border p-3 flex items-center gap-3 " + (st.atrasada ? "bg-red-50 border-red-300" : "bg-orange-50 border-orange-200")}>
                    <span className="text-xl">💊</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{t.nombre}</p>
                      <p className="text-xs text-slate-500">{st.dosisDadas}/{st.totalDosis} dosis · {st.completado ? "Completado" : st.atrasada ? <span className="text-red-600 font-semibold">¡Atrasada {formatRetraso(st.minHasta)}!</span> : <span className="text-orange-600">Próxima en {formatRetraso(st.minHasta)}</span>}</p>
                    </div>
                    {!st.completado && <button onClick={() => { registrarDosis(t.id); }} className={"text-xs font-bold px-3 py-2 rounded-xl text-white " + (st.atrasada ? "bg-red-500" : "bg-orange-400")}>Dar</button>}
                  </div>
                ); })}
                {suplActivos.map(t => { const st = calcTratStatus(t); return (
                  <div key={t.id} className={"rounded-2xl border p-3 flex items-center gap-3 " + (st.atrasada ? "bg-teal-50 border-teal-300" : "bg-teal-50 border-teal-200")}>
                    <span className="text-xl">🧴</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{t.nombre}</p>
                      <p className="text-xs text-slate-500">{st.dosisDadas}/{st.totalDosis} dosis · {st.completado ? "Completado" : st.atrasada ? <span className="text-red-600 font-semibold">¡Atrasada!</span> : <span className="text-teal-600">Próxima en {formatRetraso(st.minHasta)}</span>}</p>
                    </div>
                    {!st.completado && <button onClick={() => { registrarDosisSup(t.id); }} className="text-xs font-bold px-3 py-2 rounded-xl text-white bg-teal-500">Dar</button>}
                  </div>
                ); })}
              </div>
            );
          })()}
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-bold text-slate-700">{esHoy ? "Registros de hoy" : "Registros del " + new Date(fechaSeleccionada + "T12:00:00").toLocaleDateString("es-MX", {day:"numeric",month:"long"})}</h2>
            {records.length === 0 ? <div className="text-center py-6"><p className="text-4xl mb-2">👶</p><p className="text-slate-400 text-sm">Sin registros este día</p>{esHoy && <button onClick={() => setSeccion("registro")} className="mt-3 bg-blue-500 text-white px-5 py-2 rounded-2xl text-sm font-semibold">Registrar ahora</button>}</div>
            : <div className="space-y-2">{records.map(r => { const t = TIPOS.find(x => x.value === r.type) ?? (r.type === "PANAL_PIPI" ? { emoji: "💧", label: "Pañal pipí", color: "bg-yellow-100 border-yellow-300 text-yellow-800" } : r.type === "PANAL_POPO" ? { emoji: "💩", label: "Pañal popó", color: "bg-amber-100 border-amber-300 text-amber-800" } : undefined); const isEditing = editingId === r.id; return <div key={r.id} className={"rounded-2xl border p-3 " + (t?.color ?? "bg-slate-50")}>
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
          <div className="px-1 pt-2 pb-1">
            <h2 className="text-lg font-bold text-slate-800">Estadísticas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Resumen de los últimos días</p>
          </div>
          {baby && <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-indigo-800 truncate">{baby.name}</p>
              <p className="text-xs text-indigo-600">{diagnostico?.bebe.edadTexto ?? rangoEdad(edadMeses())} · {baby.pesoKg ? baby.pesoKg + " kg" : ""}{baby.estaturaCmd ? ` · ${baby.estaturaCmd} cm` : ""}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-indigo-700">{periodo === "semana" ? "Última semana" : "Último mes"}</p>
              {stats && <p className="text-xs text-indigo-400">{stats.totalRegistros} registros</p>}
            </div>
          </div>}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setPeriodo("semana")} className={"px-3 py-1 rounded-2xl text-xs font-semibold " + (periodo === "semana" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600")}>Semana</button>
              <button onClick={() => setPeriodo("mes")} className={"px-3 py-1 rounded-2xl text-xs font-semibold " + (periodo === "mes" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600")}>Mes</button>
            </div>
          </div>
          {stats && <>
            <div className="bg-indigo-50 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold text-indigo-800">Promedio {periodo === "semana" ? "semanal" : "mensual"} por día</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-blue-600">{stats.promedios.formula}</p><p className="text-xs text-slate-500">ml fórmula/día</p></div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-purple-600">{stats.promedios.tomas}</p>
                  <p className="text-xs text-slate-500">tomas/día</p>
                  {(stats.promedios.formulaTomas > 0 || stats.promedios.pechoTomas > 0) && <p className="text-xs text-slate-400 mt-0.5">{stats.promedios.formulaTomas > 0 ? `🍼 ${stats.promedios.formulaTomas}` : ""} {stats.promedios.pechoTomas > 0 ? `🤱 ${stats.promedios.pechoTomas}` : ""}</p>}
                </div>
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-yellow-600">{stats.promedios.pipi}</p><p className="text-xs text-slate-500">pañales pipí/día</p></div>
                <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-amber-600">{stats.promedios.popo}</p><p className="text-xs text-slate-500">pañales popó/día</p></div>
                {stats.promedios.panales > 0 && <div className="bg-yellow-50 rounded-xl p-3 text-center col-span-2"><p className="text-lg font-bold text-yellow-700">{stats.promedios.panales}</p><p className="text-xs text-slate-500">🧷 total pañales/día</p></div>}
                {stats.promedios.sueno > 0 && <>
                  <div className="bg-indigo-100 rounded-xl p-3 text-center col-span-2">
                    <p className="text-xs font-bold text-indigo-500 mb-1">😴 Sueño total / día</p>
                    <p className="text-lg font-bold text-indigo-700">{minToHm(stats.promedios.sueno)}</p>
                    <p className="text-xs text-indigo-400">{stats.promedios.sueno} min</p>
                  </div>
                  {stats.promedios.suenoDay > 0 && <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold text-amber-500 mb-1">☀️ Sueño día</p>
                    <p className="text-base font-bold text-indigo-600">{minToHm(stats.promedios.suenoDay)}</p>
                    <p className="text-xs text-slate-400">{stats.promedios.suenoDay} min</p>
                  </div>}
                  {stats.promedios.suenoNight > 0 && <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold text-blue-500 mb-1">🌙 Sueño noche</p>
                    <p className="text-base font-bold text-indigo-600">{minToHm(stats.promedios.suenoNight)}</p>
                    <p className="text-xs text-slate-400">{stats.promedios.suenoNight} min</p>
                  </div>}
                  {stats.promedios.suenoDespierto > 0 && <div className="bg-slate-100 rounded-xl p-3 text-center col-span-2">
                    <p className="text-xs font-semibold text-slate-500 mb-1">👁️ Despierto estimado</p>
                    <p className="text-base font-bold text-slate-600">{minToHm(stats.promedios.suenoDespierto)}</p>
                    <p className="text-xs text-slate-400">{stats.promedios.suenoDespierto} min</p>
                  </div>}
                </>}
                {stats.promedios.medicamentos > 0 && <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-red-600">{stats.promedios.medicamentos}</p><p className="text-xs text-slate-500">dosis 💊/día</p>{tratamientos.length > 0 && <p className="text-xs text-red-400 mt-0.5">{tratamientos.length} med.</p>}</div>}
                {stats.promedios.suplementos > 0 && <div className="bg-white rounded-xl p-3 text-center"><p className="text-lg font-bold text-teal-600">{stats.promedios.suplementos}</p><p className="text-xs text-slate-500">dosis 🧴/día</p>{suplementos.length > 0 && <p className="text-xs text-teal-400 mt-0.5">{suplementos.length} supl.</p>}</div>}
              </div>
            </div>
            {stats.promedios.panales > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-yellow-800">🧷 Estimado de pañales a comprar</p>
                <p className="text-xs text-yellow-600 mt-0.5">Basado en promedio de {stats.promedios.panales} pañales/día</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-yellow-700">{Math.ceil(stats.promedios.panales * 7)}</p>
                  <p className="text-xs text-slate-500">por semana</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-yellow-700">{Math.ceil(stats.promedios.panales * 30)}</p>
                  <p className="text-xs text-slate-500">por mes</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center col-span-2">
                  <p className="text-xl font-bold text-yellow-700">{Math.ceil(stats.promedios.panales * 365)}</p>
                  <p className="text-xs text-slate-500">por año</p>
                </div>
              </div>
            </div>}
            <p className="text-sm font-bold text-slate-700">Detalle por día</p>
            <div className="space-y-2">{stats.dias.map((d, i) => <div key={i} className="bg-slate-50 rounded-2xl p-3">
              <p className="text-xs font-bold text-slate-600 mb-2">{d.fecha}</p>
              <div className="flex gap-2 flex-wrap">
                {d.formula > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-xl">🍼 {d.formula} ml</span>}
                {d.formulaTomas > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-xl">Fórmula: {d.formulaTomas}</span>}
                {d.pechoTomas > 0 && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-xl">🤱 Pecho: {d.pechoTomas}</span>}
                {(d.panales > 0) && <span className="text-xs bg-yellow-50 text-yellow-800 font-semibold px-2 py-1 rounded-xl">🧷 {d.panales}</span>}
                {d.pipi > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-xl">💧 {d.pipi}</span>}
                {d.popo > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-xl">💩 {d.popo}</span>}
                {d.sueno > 0 && <>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-xl">😴 {minToHm(d.sueno)}</span>
                  {d.suenoDay > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-xl">☀️ {minToHm(d.suenoDay)}</span>}
                  {d.suenoNight > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-xl">🌙 {minToHm(d.suenoNight)}</span>}
                  {d.suenoDespierto > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-xl">👁️ {minToHm(d.suenoDespierto)}</span>}
                </>}
                {d.medicamentos > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-xl">💊 {d.medicamentos} dosis</span>}
                {d.suplementos > 0 && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-xl">🧴 {d.suplementos} dosis</span>}
              </div>
            </div>)}</div>
            <p className="text-xs text-slate-400 text-center">{stats.totalRegistros} registros en este periodo</p>
          </>}
          {growthHistory.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
              <h2 className="text-lg font-bold text-slate-700">Historial de crecimiento</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-purple-600 text-white">
                      <th className="px-3 py-2 text-left rounded-tl-lg font-semibold">Fecha</th>
                      <th className="px-3 py-2 text-center font-semibold">⚖️ Peso</th>
                      <th className="px-3 py-2 text-center font-semibold">📏 Estatura</th>
                      <th className="px-3 py-2 text-center rounded-tr-lg font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthHistory.map((g, i) => (
                      <tr key={g.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {new Date(g.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600">{g.pesoKg ? g.pesoKg + " kg" : "—"}</td>
                        <td className="px-3 py-2 text-center text-slate-600">{g.estaturaCmd ? g.estaturaCmd + " cm" : "—"}</td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => eliminarGrowthRecord(g.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
            <div><p className="text-sm font-bold text-indigo-800">Exportar PDF</p><p className="text-xs text-indigo-600">Reporte por día, semana, mes o año</p></div>
            <button onClick={() => window.open(`/bebe/${babyId}/export`, "_blank")} className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">Exportar</button>
          </div>
        </div>}

        {seccion === "diagnostico" && <div className="space-y-4">
          {(() => {
            const RANGOS_RECOMENDACIONES = [
              { minMeses: 0, maxMeses: 3, label: "0-3 meses", sueno: "14-17h/día", tomas: "8-12/día", pañales: "≥6 pañales/día" },
              { minMeses: 3, maxMeses: 6, label: "3-6 meses", sueno: "14-16h/día", tomas: "6-8/día", pañales: "≥5 pañales/día" },
              { minMeses: 6, maxMeses: 9, label: "6-9 meses", sueno: "13-15h/día", tomas: "4-6/día + sólidos", pañales: "≥4 pañales/día" },
              { minMeses: 9, maxMeses: 12, label: "9-12 meses", sueno: "12-15h/día", tomas: "3-5/día + sólidos", pañales: "≥4 pañales/día" },
              { minMeses: 12, maxMeses: 24, label: "12-24 meses", sueno: "11-14h/día", tomas: "2-3/día + sólidos", pañales: "≥3 pañales/día" },
              { minMeses: 24, maxMeses: 999, label: "24+ meses", sueno: "11-13h/día", tomas: "2-3/día + sólidos", pañales: "≥2 pañales/día" },
            ];
            const mesesActual = edadMeses();
            const rango = RANGOS_RECOMENDACIONES.find(r => mesesActual >= r.minMeses && mesesActual < r.maxMeses);
            if (!rango) return null;
            return (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-purple-700 uppercase">Guía de edad · {rango.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center"><p className="text-lg">😴</p><p className="text-xs font-bold text-slate-700">{rango.sueno}</p><p className="text-xs text-slate-400">Sueño</p></div>
                  <div className="text-center"><p className="text-lg">🍼</p><p className="text-xs font-bold text-slate-700">{rango.tomas}</p><p className="text-xs text-slate-400">Tomas</p></div>
                  <div className="text-center"><p className="text-lg">🧷</p><p className="text-xs font-bold text-slate-700">{rango.pañales}</p><p className="text-xs text-slate-400">Pañales</p></div>
                </div>
              </div>
            );
          })()}
          {(() => {
            const tratActivos = tratamientos.filter(t => t.activo);
            const atrasados = tratActivos.filter(t => { const st = calcTratStatus(t); return st.atrasada && !st.completado; });
            const proximos = tratActivos.filter(t => { const st = calcTratStatus(t); return !st.atrasada && !st.completado && st.minHasta <= 60; });
            if (atrasados.length === 0 && proximos.length === 0) return null;
            return (
              <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-4 space-y-2">
                <div className="flex items-center gap-2"><span className="text-xl">💊</span><p className="text-sm font-bold text-red-800">Alertas de medicamento</p></div>
                {atrasados.map(t => { const st = calcTratStatus(t); return (
                  <div key={t.id} className="bg-white rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
                    <div><p className="text-sm font-bold text-red-700">{t.nombre} — dosis atrasada</p><p className="text-xs text-red-500">{t.dosis} · hace {formatRetraso(st.minHasta)}</p></div>
                    <button onClick={() => registrarDosis(t.id)} disabled={registrandoDosis === t.id} className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500 text-white shrink-0 disabled:opacity-50">{registrandoDosis === t.id ? "..." : "Dar ahora"}</button>
                  </div>
                ); })}
                {proximos.map(t => { const st = calcTratStatus(t); return (
                  <div key={t.id} className="bg-white rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
                    <div><p className="text-sm font-semibold text-orange-700">{t.nombre}</p><p className="text-xs text-orange-500">{t.dosis} · próxima en {formatRetraso(st.minHasta)}</p></div>
                    <button onClick={() => registrarDosis(t.id)} disabled={registrandoDosis === t.id} className="px-3 py-2 rounded-xl text-xs font-bold bg-orange-400 text-white shrink-0 disabled:opacity-50">{registrandoDosis === t.id ? "..." : "Dar ahora"}</button>
                  </div>
                ); })}
              </div>
            );
          })()}
          {diagnostico && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-bold text-slate-700">Diagnóstico de hoy</h2>
            <div className="bg-slate-50 rounded-2xl p-3 text-sm text-slate-600 space-y-1">
              <p>Meta: <strong>{diagnostico.bebe.mlRecomendadosDia} ml</strong> en <strong>{diagnostico.bebe.tomasMinDia}-{diagnostico.bebe.tomasMaxDia} tomas</strong></p>
              <p>Por toma: <strong>{diagnostico.bebe.mlMinPorToma}-{diagnostico.bebe.mlMaxPorToma} ml</strong></p>
            </div>
            {(() => {
              const meses = edadMeses();
              const rec = sleepRecByAge(meses);
              const suenoHoy = records.filter(r => r.type === "SUENO").reduce((s, r) => s + (r.pechoMin ?? 0), 0);
              if (suenoHoy === 0) return null;
              const ok = suenoHoy >= rec.min && suenoHoy <= rec.max;
              const bajo = suenoHoy < rec.min;
              return (
                <div className={"rounded-2xl p-3 " + (ok ? "bg-green-50 border border-green-200" : bajo ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200")}>
                  <p className="text-xs font-bold text-slate-600 mb-1">😴 Sueño hoy · {rangoEdad(meses)}</p>
                  <p className="text-sm font-semibold text-slate-800">{minToHm(suenoHoy)} registrados</p>
                  <p className="text-xs text-slate-500">Meta esperada: {minToHm(rec.min)} – {minToHm(rec.max)}</p>
                  <p className={"text-xs font-semibold mt-1 " + (ok ? "text-green-700" : bajo ? "text-orange-700" : "text-blue-700")}>
                    {ok ? "✅ Buen descanso para su edad" : bajo ? "⚠️ Sueño por debajo de lo recomendado" : "ℹ️ Sueño por encima del promedio"}
                  </p>
                </div>
              );
            })()}
            {diagnostico.alertasCriticas.filter(a => !dismissedAlerts.has("crit:" + a)).map((a, i) => <div key={i} className="bg-red-50 border border-red-200 rounded-2xl p-3 flex gap-2 items-start"><span>🚨</span><p className="text-sm text-red-800 font-semibold flex-1">{a}</p><button onClick={() => setDismissedAlerts(prev => new Set([...prev, "crit:" + a]))} className="text-xs text-red-400 font-semibold border border-red-200 px-2 py-1 rounded-xl shrink-0">Aceptar</button></div>)}
            {diagnostico.alertas.filter(a => !dismissedAlerts.has("alrt:" + a)).map((a, i) => <div key={i} className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex gap-2 items-start"><span>⚠️</span><p className="text-sm text-orange-800 flex-1">{a}</p><button onClick={() => setDismissedAlerts(prev => new Set([...prev, "alrt:" + a]))} className="text-xs text-orange-400 font-semibold border border-orange-200 px-2 py-1 rounded-xl shrink-0">Aceptar</button></div>)}
            {diagnostico.positivos.filter(p => !dismissedAlerts.has("pos:" + p)).map((p, i) => <div key={i} className="bg-green-50 border border-green-200 rounded-2xl p-3 flex gap-2 items-start"><span>✅</span><p className="text-sm text-green-800 flex-1">{p}</p><button onClick={() => setDismissedAlerts(prev => new Set([...prev, "pos:" + p]))} className="text-xs text-green-400 font-semibold border border-green-200 px-2 py-1 rounded-xl shrink-0">Aceptar</button></div>)}
            {diagnostico.alertas.length === 0 && diagnostico.alertasCriticas.length === 0 && diagnostico.positivos.length === 0 && <p className="text-sm text-slate-400 text-center py-2">Sin alertas por el momento</p>}
          </div>}
          {historial.length > 0 && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-700">Historial de diagnósticos</h2>
            <div className="space-y-2">{historial.map((h) => (
              <div key={h.id} className="bg-slate-50 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-bold text-slate-600">{h.fecha}</p>
                {h.alertasCriticas.map((a, j) => <div key={j} className="flex gap-2 items-start"><span className="text-sm">🚨</span><p className="text-xs text-red-700 font-semibold">{a}</p></div>)}
                {h.alertas.map((a, j) => <div key={j} className="flex gap-2 items-start"><span className="text-sm">⚠️</span><p className="text-xs text-orange-700">{a}</p></div>)}
                {h.positivos.map((p, j) => <div key={j} className="flex gap-2 items-start"><span className="text-sm">✅</span><p className="text-xs text-green-700">{p}</p></div>)}
                {h.alertasCriticas.length === 0 && h.alertas.length === 0 && h.positivos.length === 0 && <p className="text-xs text-slate-400 italic">Sin alertas este día</p>}
              </div>
            ))}</div>
          </div>}
          {stats && stats.dias.length > 0 && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-500">Resumen por día (últimos 7-30 días)</h2>
            <div className="space-y-2">{stats.dias.slice().reverse().map((d, i) => {
              const meses = edadMeses();
              const rec = sleepRecByAge(meses);
              const suenoOk = d.sueno > 0 && d.sueno >= rec.min && d.sueno <= rec.max;
              const suenoBajo = d.sueno > 0 && d.sueno < rec.min;
              return (
                <div key={i} className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">{d.fecha}</p>
                  <div className="flex gap-2 flex-wrap">
                    {d.tomas > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-xl">🍼 {d.formulaTomas > 0 ? d.formulaTomas + " fórmula" : ""}{d.formulaTomas > 0 && d.pechoTomas > 0 ? " · " : ""}{d.pechoTomas > 0 ? d.pechoTomas + " pecho" : ""}</span>}
                    {d.formula > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-xl">{d.formula} ml</span>}
                    {d.panales > 0 && <span className="text-xs bg-yellow-50 text-yellow-800 font-semibold px-2 py-1 rounded-xl">🧷 {d.panales}</span>}
                    {d.pipi > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-xl">💧 {d.pipi}</span>}
                    {d.popo > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-xl">💩 {d.popo}</span>}
                    {d.sueno > 0 && <span className={"text-xs px-2 py-1 rounded-xl " + (suenoOk ? "bg-green-100 text-green-700" : suenoBajo ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700")}>😴 {minToHm(d.sueno)} {suenoOk ? "✅" : suenoBajo ? "⚠️" : ""}</span>}
                    {d.suenoDay > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-xl">☀️ {minToHm(d.suenoDay)}</span>}
                    {d.suenoNight > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-xl">🌙 {minToHm(d.suenoNight)}</span>}
                    {d.medicamentos > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-xl">💊 {d.medicamentos}</span>}
                    {d.suplementos > 0 && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-xl">🧴 {d.suplementos}</span>}
                  </div>
                </div>
              );
            })}</div>
          </div>}
          {(() => {
            const hasMeds = records.some(r => r.type === "MEDICAMENTO" || r.type === "SUPLEMENTO");
            return (
              <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-700">Análisis con IA 🤖</h2>
                  {hasMeds && !loadingAI && <button onClick={() => checkMedsAndLoadAI(records)} className="text-xs text-purple-600 border border-purple-300 px-3 py-1 rounded-xl font-semibold">Reintentar</button>}
                </div>
                {!hasMeds && <p className="text-sm text-slate-400 py-2">Registra un medicamento o suplemento hoy para obtener el análisis de IA.</p>}
                {hasMeds && loadingAI && <div className="flex gap-2 items-center py-2"><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-purple-600 italic">Analizando con IA...</p></div>}
                {hasMeds && aiAnalisis && !loadingAI && <div className="space-y-2"><p className="text-sm text-purple-700 leading-relaxed">{aiAnalisis}</p><p className="text-xs text-slate-400">Recuerda siempre consultar a tu pediatra.</p></div>}
                {hasMeds && aiError && !loadingAI && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 space-y-1"><p className="text-sm font-semibold text-red-700">No se pudo obtener el análisis</p><p className="text-xs text-red-500">{aiError}</p></div>}
              </div>
            );
          })()}
          {!diagnostico && <div className="bg-white rounded-3xl shadow-sm border p-5 text-center py-8"><p className="text-5xl mb-3">🩺</p><p className="text-slate-500 text-sm">Sin datos de diagnóstico para hoy</p><p className="text-slate-400 text-xs mt-1">Registra tomas o pañales para ver el diagnóstico</p></div>}
        </div>}

        {seccion === "registro" && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-700">Nuevo registro</h2>
          <div className="grid grid-cols-2 gap-3">{TIPOS.map(t => <button key={t.value} onClick={() => setTipo(t.value)} className={"p-4 rounded-2xl border-2 text-left transition-all " + (tipo === t.value ? t.color + " border-current shadow-md" : "bg-slate-50 border-slate-200 text-slate-600")}><p className="text-3xl mb-1">{t.emoji}</p><p className="font-semibold text-sm">{t.label}</p></button>)}</div>
          <div><label className="text-sm font-semibold text-purple-700 block mb-2">Hora</label><input type="time" value={horaRegistro} onChange={e => setHoraRegistro(e.target.value)} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
          {tipo === "FORMULA" && <div><label className="text-sm font-semibold text-purple-700 block mb-2">Mililitros</label><div className="flex gap-2 flex-wrap mb-2">{[30,60,90,120,150,180].map(ml => <button key={ml} onClick={() => setFormulaMl(String(ml))} className={"px-4 py-2 rounded-2xl border-2 font-semibold text-sm " + (formulaMl === String(ml) ? "bg-blue-500 text-white border-blue-500" : "bg-white border-slate-200 text-slate-600")}>{ml}</button>)}</div><input type="number" value={formulaMl} onChange={e => setFormulaMl(e.target.value)} placeholder="Otra cantidad" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
          {tipo === "SUENO" && <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-purple-700 block mb-2">Hora que se durmió</label><input type="time" value={suenoInicio} onChange={e => setSuenoInicio(e.target.value)} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
                <div><label className="text-sm font-semibold text-purple-700 block mb-2">Hora que despertó</label><input type="time" value={suenoFin} onChange={e => setSuenoFin(e.target.value)} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
              </div>
              {suenoInicio && suenoFin && (() => { const [sh,sm]=suenoInicio.split(":").map(Number); const [eh,em]=suenoFin.split(":").map(Number); let m=(eh*60+em)-(sh*60+sm); if(m<=0)m+=1440; return <p className="text-xs text-center text-indigo-600 font-semibold bg-indigo-50 rounded-xl py-2">😴 Duración: {minToHm(m)}</p>; })()}
            </div>}
          {tipo === "PECHO" && <div><label className="text-sm font-semibold text-purple-700 block mb-2">Minutos</label><div className="flex gap-2 flex-wrap mb-2">{[5,10,15,20,30,60].map(min => <button key={min} onClick={() => setPechoMin(String(min))} className={"px-4 py-2 rounded-2xl border-2 font-semibold text-sm " + (pechoMin === String(min) ? "bg-pink-500 text-white border-pink-500" : "bg-white border-slate-200 text-slate-600")}>{min}</button>)}</div><input type="number" value={pechoMin} onChange={e => setPechoMin(e.target.value)} placeholder="Otros minutos" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
          {tipo === "PANAL" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-700 block">Contenido del pañal</label>
              <div className="flex gap-3">
                <button onClick={() => setPanalPipi(v => !v)} className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-sm transition-all " + (panalPipi ? "bg-yellow-100 border-yellow-400 text-yellow-800" : "bg-white border-slate-200 text-slate-500")}>
                  <span className={"w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 " + (panalPipi ? "bg-yellow-400 border-yellow-400 text-white" : "border-slate-300 text-transparent")}>✓</span>
                  💧 Pipí
                </button>
                <button onClick={() => setPanalPopo(v => !v)} className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-sm transition-all " + (panalPopo ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-white border-slate-200 text-slate-500")}>
                  <span className={"w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 " + (panalPopo ? "bg-amber-400 border-amber-400 text-white" : "border-slate-300 text-transparent")}>✓</span>
                  💩 Popó
                </button>
              </div>
              {!panalPipi && !panalPopo && <p className="text-xs text-red-500 text-center">Selecciona al menos una opción</p>}
            </div>
          )}
          {(tipo === "MEDICAMENTO" || tipo === "SUPLEMENTO") && <div><label className="text-sm font-semibold text-purple-700 block mb-2">{tipo === "MEDICAMENTO" ? "Nombre y dosis (toma única)" : "Nombre del suplemento (toma única)"}</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder={tipo === "MEDICAMENTO" ? "Ej: Paracetamol 2.5ml" : "Ej: Vitamina D 400 UI"} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
          {tipo === "MEDICAMENTO" && (() => {
            const tratActivos = tratamientos.filter(t => t.activo);
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-red-700">💊 Tratamientos activos</p>
                  <button onClick={() => setShowNuevoTrat(v => !v)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-xl font-semibold border border-red-200">{showNuevoTrat ? "Cancelar" : "+ Nuevo tratamiento"}</button>
                </div>
                {showNuevoTrat && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-red-700">Indicación médica</p>
                    <input value={tNombre} onChange={e => setTNombre(e.target.value)} placeholder="Nombre del medicamento (Ej: Ibuprofeno)" className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-red-200 focus:outline-none focus:border-red-400" />
                    <input value={tDosis} onChange={e => setTDosis(e.target.value)} placeholder="Dosis (Ej: 2.5ml, 1 tableta)" className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-red-200 focus:outline-none focus:border-red-400" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-red-600 block mb-1">Cada cuántas horas</label>
                        <div className="flex gap-1 flex-wrap mb-1">{[4,6,8,12,24].map(h => <button key={h} onClick={() => setTFrecuencia(String(h))} className={"px-2 py-1 rounded-lg border text-xs font-semibold " + (tFrecuencia === String(h) ? "bg-red-500 text-white border-red-500" : "bg-white border-slate-200 text-slate-600")}>{h}h</button>)}</div>
                        <input type="number" value={tFrecuencia} onChange={e => setTFrecuencia(e.target.value)} placeholder="horas" className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-400" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-red-600 block mb-1">Total de días</label>
                        <div className="flex gap-1 flex-wrap mb-1">{[3,5,7,10,14].map(d => <button key={d} onClick={() => setTDias(String(d))} className={"px-2 py-1 rounded-lg border text-xs font-semibold " + (tDias === String(d) ? "bg-red-500 text-white border-red-500" : "bg-white border-slate-200 text-slate-600")}>{d}d</button>)}</div>
                        <input type="number" value={tDias} onChange={e => setTDias(e.target.value)} placeholder="días" className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-red-600 block mb-1">Fecha de inicio</label>
                      <input type="date" value={tFechaInicio} onChange={e => setTFechaInicio(e.target.value)} className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-400" />
                    </div>
                    {tFrecuencia && tDias && <p className="text-xs text-red-600 bg-white rounded-xl px-3 py-2 border border-red-100">Total estimado: <strong>{Math.ceil((parseInt(tDias) * 24) / parseInt(tFrecuencia))} dosis</strong> en {tDias} días</p>}
                    <button onClick={crearTratamiento} disabled={savingTrat || !tNombre || !tDosis} className="w-full py-3 rounded-xl font-bold text-sm bg-red-500 text-white disabled:opacity-50">{savingTrat ? "Guardando..." : "Iniciar tratamiento"}</button>
                  </div>
                )}
                {tratActivos.length === 0 && !showNuevoTrat && <p className="text-xs text-slate-400 text-center py-2">Sin tratamientos activos — registra uno con el médico</p>}
                {tratActivos.map(t => {
                  const st = calcTratStatus(t);
                  return (
                    <div key={t.id} className={"rounded-2xl border-2 p-4 space-y-2 " + (st.atrasada ? "bg-red-50 border-red-300" : st.completado ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{t.nombre}</p>
                          <p className="text-xs text-slate-500">{t.dosis} · cada {t.frecuenciaHoras}h · {t.diasTotal} días</p>
                        </div>
                        {st.atrasada && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg font-bold shrink-0">¡ATRASADA!</span>}
                        {st.completado && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg font-bold shrink-0">Completado</span>}
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Dosis dadas</span>
                          <span className="font-bold text-slate-700">{st.dosisDadas} / {st.totalDosis}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(100, (st.dosisDadas / st.totalDosis) * 100)}%` }} />
                        </div>
                        {!st.completado && <div className="flex justify-between text-xs pt-1">
                          <span className="text-slate-500">Próxima dosis</span>
                          <span className={"font-semibold " + (st.atrasada ? "text-red-600" : "text-orange-600")}>
                            {st.atrasada ? `Hace ${formatRetraso(st.minHasta)}` : `En ${formatRetraso(st.minHasta)}`}
                          </span>
                        </div>}
                      </div>
                      <div className="flex gap-2">
                        {!st.completado && <button onClick={() => registrarDosis(t.id)} disabled={registrandoDosis === t.id} className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-500 text-white disabled:opacity-50">{registrandoDosis === t.id ? "Registrando..." : "✓ Dar dosis ahora"}</button>}
                        <button onClick={() => cerrarTratamiento(t.id)} className="px-3 py-2 rounded-xl text-xs text-slate-500 border border-slate-200 bg-white">Cerrar</button>
                      </div>
                    </div>
                  );
                })}
                {tratamientos.filter(t => !t.activo).length > 0 && (
                  <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer">Ver tratamientos cerrados ({tratamientos.filter(t => !t.activo).length})</summary>
                    <div className="mt-2 space-y-1">
                      {tratamientos.filter(t => !t.activo).map(t => {
                        const st = calcTratStatus(t);
                        return <div key={t.id} className="bg-slate-50 rounded-xl px-3 py-2 flex justify-between items-center">
                          <span className="text-slate-600">{t.nombre} · {t.dosis}</span>
                          <span className="text-slate-400">{st.dosisDadas}/{st.totalDosis} dosis</span>
                        </div>;
                      })}
                    </div>
                  </details>
                )}
              </div>
            );
          })()}
          {tipo === "SUPLEMENTO" && (() => {
            const suplActivos = suplementos.filter(t => t.activo);
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-teal-700">🧴 Suplementos activos</p>
                  <button onClick={() => setShowNuevoSupl(v => !v)} className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-xl font-semibold border border-teal-200">{showNuevoSupl ? "Cancelar" : "+ Nuevo suplemento"}</button>
                </div>
                {showNuevoSupl && (
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-teal-700">Indicación médica</p>
                    <input value={sNombre} onChange={e => setSNombre(e.target.value)} placeholder="Nombre del suplemento (Ej: Vitamina D)" className="w-full border-2 border-teal-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-teal-200 focus:outline-none focus:border-teal-400" />
                    <input value={sDosis} onChange={e => setSDosis(e.target.value)} placeholder="Dosis (Ej: 400 UI, 1 gota)" className="w-full border-2 border-teal-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-teal-200 focus:outline-none focus:border-teal-400" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-teal-600 block mb-1">Cada cuántas horas</label>
                        <div className="flex gap-1 flex-wrap mb-1">{[8,12,24,48].map(h => <button key={h} onClick={() => setSFrecuencia(String(h))} className={"px-2 py-1 rounded-lg border text-xs font-semibold " + (sFrecuencia === String(h) ? "bg-teal-500 text-white border-teal-500" : "bg-white border-slate-200 text-slate-600")}>{h}h</button>)}</div>
                        <input type="number" value={sFrecuencia} onChange={e => setSFrecuencia(e.target.value)} placeholder="horas" className="w-full border-2 border-teal-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-400" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-teal-600 block mb-1">Total de días</label>
                        <div className="flex gap-1 flex-wrap mb-1">{[7,14,30,60,90].map(d => <button key={d} onClick={() => setSDias(String(d))} className={"px-2 py-1 rounded-lg border text-xs font-semibold " + (sDias === String(d) ? "bg-teal-500 text-white border-teal-500" : "bg-white border-slate-200 text-slate-600")}>{d}d</button>)}</div>
                        <input type="number" value={sDias} onChange={e => setSDias(e.target.value)} placeholder="días" className="w-full border-2 border-teal-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-teal-600 block mb-1">Fecha de inicio</label>
                      <input type="date" value={sFechaInicio} onChange={e => setSFechaInicio(e.target.value)} className="w-full border-2 border-teal-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-teal-400" />
                    </div>
                    {sFrecuencia && sDias && <p className="text-xs text-teal-600 bg-white rounded-xl px-3 py-2 border border-teal-100">Total estimado: <strong>{Math.ceil((parseInt(sDias) * 24) / parseInt(sFrecuencia))} dosis</strong> en {sDias} días</p>}
                    <button onClick={crearSuplemento} disabled={savingSupl || !sNombre || !sDosis} className="w-full py-3 rounded-xl font-bold text-sm bg-teal-500 text-white disabled:opacity-50">{savingSupl ? "Guardando..." : "Iniciar suplemento"}</button>
                  </div>
                )}
                {suplActivos.length === 0 && !showNuevoSupl && <p className="text-xs text-slate-400 text-center py-2">Sin suplementos activos — registra uno indicado por el médico</p>}
                {suplActivos.map(t => {
                  const st = calcTratStatus(t);
                  return (
                    <div key={t.id} className={"rounded-2xl border-2 p-4 space-y-2 " + (st.atrasada ? "bg-teal-50 border-teal-400" : st.completado ? "bg-green-50 border-green-200" : "bg-teal-50 border-teal-200")}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{t.nombre}</p>
                          <p className="text-xs text-slate-500">{t.dosis} · cada {t.frecuenciaHoras}h · {t.diasTotal} días</p>
                        </div>
                        {st.atrasada && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg font-bold shrink-0">¡ATRASADA!</span>}
                        {st.completado && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg font-bold shrink-0">Completado</span>}
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2 space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Dosis dadas</span><span className="font-bold text-slate-700">{st.dosisDadas} / {st.totalDosis}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(100, (st.dosisDadas / st.totalDosis) * 100)}%` }} /></div>
                        {!st.completado && <div className="flex justify-between text-xs pt-1"><span className="text-slate-500">Próxima dosis</span><span className={"font-semibold " + (st.atrasada ? "text-red-600" : "text-teal-600")}>{st.atrasada ? `Hace ${formatRetraso(st.minHasta)}` : `En ${formatRetraso(st.minHasta)}`}</span></div>}
                      </div>
                      <div className="flex gap-2">
                        {!st.completado && <button onClick={() => registrarDosisSup(t.id)} disabled={registrandoDosisSup === t.id} className="flex-1 py-2 rounded-xl text-sm font-bold bg-teal-500 text-white disabled:opacity-50">{registrandoDosisSup === t.id ? "Registrando..." : "✓ Dar dosis ahora"}</button>}
                        <button onClick={() => cerrarSuplemento(t.id)} className="px-3 py-2 rounded-xl text-xs text-slate-500 border border-slate-200 bg-white">Cerrar</button>
                      </div>
                    </div>
                  );
                })}
                {suplementos.filter(t => !t.activo).length > 0 && (
                  <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer">Ver suplementos cerrados ({suplementos.filter(t => !t.activo).length})</summary>
                    <div className="mt-2 space-y-1">{suplementos.filter(t => !t.activo).map(t => { const st = calcTratStatus(t); return <div key={t.id} className="bg-slate-50 rounded-xl px-3 py-2 flex justify-between items-center"><span className="text-slate-600">{t.nombre} · {t.dosis}</span><span className="text-slate-400">{st.dosisDadas}/{st.totalDosis} dosis</span></div>; })}</div>
                  </details>
                )}
              </div>
            );
          })()}
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

        {seccion === "guias" && (() => {
          const meses = edadMeses();
          const rangoEst = getRangoEstimulacion(meses);
          const rangoAli = getRangoAlimentacion(meses);
          const recPanal = getRecomendacionPanal(meses, baby?.pesoKg ?? null);
          return (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setGuiaTab("estimulacion")} className={"flex-1 py-2 rounded-2xl font-semibold text-sm " + (guiaTab === "estimulacion" ? "bg-emerald-500 text-white shadow-md" : "bg-white text-slate-600 border")}>Estimulación</button>
                <button onClick={() => setGuiaTab("alimentacion")} className={"flex-1 py-2 rounded-2xl font-semibold text-sm " + (guiaTab === "alimentacion" ? "bg-emerald-500 text-white shadow-md" : "bg-white text-slate-600 border")}>Alimentación</button>
                <button onClick={() => setGuiaTab("panal")} className={"flex-1 py-2 rounded-2xl font-semibold text-sm " + (guiaTab === "panal" ? "bg-sky-500 text-white shadow-md" : "bg-white text-slate-600 border")}>Pañal 🩲</button>
              </div>

              {guiaTab === "estimulacion" && (
                rangoEst ? (
                  <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-700">Estimulación temprana</h2>
                      <p className="text-sm text-emerald-600 font-semibold mt-1">{rangoEst.titulo}</p>
                    </div>
                    <p className="text-xs text-slate-400">Marca las actividades que realizaste hoy</p>
                    <div className="space-y-3">
                      {rangoEst.actividades.map(act => {
                        const done = checks.includes(act.key);
                        return (
                          <button key={act.key} onClick={() => toggleCheck(act.key)}
                            className={"w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all " + (done ? "bg-emerald-50 border-emerald-400" : "bg-slate-50 border-slate-200")}>
                            <span className={"w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold " + (done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent")}>✓</span>
                            <p className={"text-sm " + (done ? "text-emerald-800 font-semibold" : "text-slate-700")}>{act.texto}</p>
                          </button>
                        );
                      })}
                    </div>
                    {loadingChecks && <p className="text-xs text-slate-400 text-center">Cargando...</p>}
                    <div className="bg-emerald-50 rounded-2xl p-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-emerald-800">{checks.filter(c => rangoEst.actividades.some(a => a.key === c)).length} de {rangoEst.actividades.length} actividades</p>
                      <span className="text-lg">✅</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-500">Notas del día</label>
                        {savingNota && <span className="text-xs text-emerald-500">Guardando...</span>}
                      </div>
                      <textarea value={nota} onChange={e => handleNotaChange(e.target.value)} placeholder="Observaciones, reacciones, logros..." rows={3} className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-emerald-400 resize-none" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border p-8 text-center space-y-2">
                    <p className="text-3xl">👶</p>
                    <p className="text-slate-500 text-sm">Sin guía disponible para esta edad</p>
                    <p className="text-slate-400 text-xs">Verifica la fecha de nacimiento en Perfil</p>
                  </div>
                )
              )}

              {guiaTab === "panal" && (
                <div className="space-y-4">
                  {recPanal ? (
                    <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-lg font-bold text-slate-700">Recomendación de pañal</h2>
                          <button onClick={loadAll} className="text-xs bg-sky-100 text-sky-700 font-semibold px-3 py-1 rounded-xl border border-sky-200 hover:bg-sky-200 transition-colors shrink-0">🔄 Recalcular</button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Basada en edad{baby?.pesoKg ? " y peso" : ""}{baby?.estaturaCmd ? " y estatura" : ""}{!baby?.pesoKg ? " (agrega peso y estatura en Perfil para mayor precisión)" : ""}</p>
                      </div>
                      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex flex-col items-center gap-2">
                        <p className="text-5xl font-black text-sky-600">{recPanal.talla}</p>
                        <p className="text-base font-bold text-sky-800">{recPanal.nombre}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-2xl p-3 text-center">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Peso recomendado</p>
                          <p className="text-sm font-bold text-slate-700">{recPanal.pesoMin} – {recPanal.pesoMax < 100 ? recPanal.pesoMax : "+"} kg</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 text-center">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Etapa</p>
                          <p className="text-sm font-bold text-slate-700">{recPanal.mesesMin} – {recPanal.mesesMax < 100 ? recPanal.mesesMax : "+"} meses</p>
                        </div>
                      </div>
                      {(baby?.pesoKg || baby?.estaturaCmd) && (
                        <div className="bg-emerald-50 rounded-2xl px-4 py-3 space-y-1">
                          {baby?.pesoKg && <div className="flex items-center gap-2"><span className="text-emerald-500">⚖️</span><p className="text-sm text-emerald-800">Peso: <strong>{baby.pesoKg} kg</strong></p></div>}
                          {baby?.estaturaCmd && <div className="flex items-center gap-2"><span className="text-emerald-500">📏</span><p className="text-sm text-emerald-800">Estatura: <strong>{baby.estaturaCmd} cm</strong></p></div>}
                        </div>
                      )}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                        <p className="text-xs font-bold text-amber-700 mb-1">Consejo</p>
                        <p className="text-sm text-amber-800">{recPanal.nota}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border p-8 text-center space-y-2">
                      <p className="text-3xl">🩲</p>
                      <p className="text-slate-500 text-sm">Sin recomendación disponible</p>
                      <p className="text-slate-400 text-xs">Verifica la fecha de nacimiento en Perfil</p>
                    </div>
                  )}
                  <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                    <p className="text-sm font-bold text-slate-700">Guía de tallas por marca</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-sky-600 text-white">
                            <th className="px-3 py-2 text-left rounded-tl-lg font-semibold">Talla</th>
                            <th className="px-3 py-2 text-center font-semibold">Peso (kg)</th>
                            <th className="px-3 py-2 text-center rounded-tr-lg font-semibold">Edad aprox.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { t: "RN", p: "hasta 4", e: "0-1 mes" },
                            { t: "1 (P)", p: "2 – 5.5", e: "0-3 meses" },
                            { t: "2 (M)", p: "4 – 8", e: "2-6 meses" },
                            { t: "3 (G)", p: "6 – 11", e: "5-12 meses" },
                            { t: "4 (XG)", p: "9 – 14", e: "10-24 meses" },
                            { t: "5 (XXG)", p: "12 – 18", e: "18-36 meses" },
                            { t: "6", p: "16+", e: "30+ meses" },
                          ].map((row, i) => (
                            <tr key={row.t} className={(i % 2 === 0 ? "bg-white" : "bg-slate-50") + (recPanal?.talla === row.t ? " ring-2 ring-sky-400 ring-inset font-bold" : "")}>
                              <td className="px-3 py-2 font-semibold text-slate-700">{row.t}</td>
                              <td className="px-3 py-2 text-center text-slate-600">{row.p}</td>
                              <td className="px-3 py-2 text-center text-slate-600">{row.e}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-400">* Las tallas varían ligeramente entre marcas (Pampers, Huggies, Winnie Pooh). Verifica siempre el empaque.</p>
                  </div>
                </div>
              )}

              {guiaTab === "alimentacion" && (
                rangoAli ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-700">Plan de alimentación</h2>
                        <p className="text-sm text-emerald-600 font-semibold mt-1">{rangoAli.titulo}</p>
                      </div>
                      <div className="bg-blue-50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-blue-700 mb-1">Leche</p>
                        <p className="text-sm text-blue-800">{rangoAli.leche}</p>
                      </div>
                      {rangoAli.solidos && (
                        <div className="bg-orange-50 rounded-2xl p-4">
                          <p className="text-xs font-bold text-orange-700 mb-1">Sólidos</p>
                          <p className="text-sm text-orange-800">{rangoAli.solidos}</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                      <p className="text-sm font-bold text-green-700">Alimentos permitidos</p>
                      {rangoAli.alimentos.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-green-500 text-sm mt-0.5">✓</span>
                          <p className="text-sm text-slate-700">{a}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                      <p className="text-sm font-bold text-red-600">Evitar por ahora</p>
                      {rangoAli.evitar.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-red-400 text-sm mt-0.5">✗</span>
                          <p className="text-sm text-slate-700">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border p-8 text-center space-y-2">
                    <p className="text-3xl">🍼</p>
                    <p className="text-slate-500 text-sm">Sin guía disponible para esta edad</p>
                    <p className="text-slate-400 text-xs">Verifica la fecha de nacimiento en Perfil</p>
                  </div>
                )
              )}
            </div>
          );
        })()}

        {seccion === "lactancia" && (() => {
          const pregActual = PREGUNTAS_LACTANCIA[lactPregunta];
          const resultado = lactCompleto ? calcularResultadoLactancia(lactRespuestas) : null;
          const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
            verde:   { bg: "bg-emerald-50",  border: "border-emerald-300", text: "text-emerald-800", badge: "bg-emerald-500" },
            amarillo:{ bg: "bg-yellow-50",   border: "border-yellow-300",  text: "text-yellow-800",  badge: "bg-yellow-500" },
            rojo:    { bg: "bg-red-50",      border: "border-red-300",     text: "text-red-800",     badge: "bg-red-500" },
          };
          return (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border p-5">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🤱</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-700">Evaluación de Lactancia</h2>
                    <p className="text-xs text-pink-500 font-semibold">10 preguntas · Resultado personalizado</p>
                  </div>
                </div>
              </div>

              {!lactCompleto ? (
                <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-5">
                  {/* Progreso */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-slate-500">Pregunta {lactPregunta + 1} de {PREGUNTAS_LACTANCIA.length}</p>
                      <p className="text-xs font-bold text-pink-500">{Math.round(((lactPregunta) / PREGUNTAS_LACTANCIA.length) * 100)}%</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(lactPregunta / PREGUNTAS_LACTANCIA.length) * 100}%` }} />
                    </div>
                  </div>

                  {/* Pregunta */}
                  <p className="text-base font-bold text-slate-800">{pregActual.texto}</p>

                  {/* Opciones */}
                  <div className="space-y-2">
                    {pregActual.opciones.map(op => {
                      const seleccionada = lactRespuestas[pregActual.id] === op.valor;
                      return (
                        <button key={op.valor} onClick={() => setLactRespuestas(prev => ({ ...prev, [pregActual.id]: op.valor }))}
                          className={"w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all " + (seleccionada ? "bg-pink-500 border-pink-500 text-white shadow-md" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-pink-300")}>
                          {op.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navegación */}
                  <div className="flex gap-3 pt-1">
                    {lactPregunta > 0 && (
                      <button onClick={() => setLactPregunta(p => p - 1)} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm">
                        ← Anterior
                      </button>
                    )}
                    {lactPregunta < PREGUNTAS_LACTANCIA.length - 1 ? (
                      <button
                        disabled={lactRespuestas[pregActual.id] === undefined}
                        onClick={() => setLactPregunta(p => p + 1)}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm bg-pink-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        disabled={lactRespuestas[pregActual.id] === undefined}
                        onClick={() => setLactCompleto(true)}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm bg-pink-600 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                        Ver resultado ✨
                      </button>
                    )}
                  </div>
                </div>
              ) : resultado && (
                <div className="space-y-4">
                  {/* Resultado principal */}
                  <div className={"rounded-3xl border-2 p-6 space-y-3 " + colorMap[resultado.nivel].bg + " " + colorMap[resultado.nivel].border}>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{resultado.emoji}</span>
                      <div>
                        <p className="text-lg font-black text-slate-800">{resultado.titulo}</p>
                        <p className="text-sm text-slate-600">{resultado.subtitulo}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
                      <p className="text-sm font-semibold text-slate-600">Puntaje total</p>
                      <p className={"text-2xl font-black " + colorMap[resultado.nivel].text}>{resultado.puntaje} / 20</p>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                    <p className="text-sm font-bold text-slate-700">
                      {resultado.nivel === "verde" ? "Tips para mantener tu producción" :
                       resultado.nivel === "amarillo" ? "Plan de acción" : "Recomendaciones urgentes"}
                    </p>
                    {resultado.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={"mt-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 " + colorMap[resultado.nivel].badge}>{i + 1}</span>
                        <p className="text-sm text-slate-700">{tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* Botón reiniciar */}
                  <button onClick={() => { setLactPregunta(0); setLactRespuestas({}); setLactCompleto(false); }}
                    className="w-full py-3 rounded-2xl border-2 border-pink-300 text-pink-600 font-semibold text-sm">
                    Repetir evaluación
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {seccion === "vacunas" && (() => {
          const meses = edadMeses();
          const pendientes = VACUNAS_CALENDARIO.filter(v => v.edadMeses <= meses + 1);
          const futuras = VACUNAS_CALENDARIO.filter(v => v.edadMeses > meses + 1);
          const yaAplicadas = (nombre: string) => vacunas.find(v => v.nombre === nombre);
          return (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💉</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-700">Cartilla de vacunación</h2>
                    <p className="text-xs text-cyan-600 font-semibold">{meses} meses de edad · Esquema México</p>
                  </div>
                </div>
                {vacunaForm && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-cyan-700">Registrar vacuna: {vacunaForm.nombre}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={vacunaForm.folio} onChange={e => setVacunaForm(f => f ? { ...f, folio: e.target.value } : null)} placeholder="Folio/lote" className="w-full border-2 border-cyan-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-cyan-400" />
                      <input value={vacunaForm.clinica} onChange={e => setVacunaForm(f => f ? { ...f, clinica: e.target.value } : null)} placeholder="Clínica/unidad" className="w-full border-2 border-cyan-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-cyan-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-cyan-600 block mb-1">Fecha y hora de aplicación</label>
                      <input type="datetime-local" value={vacunaForm.aplicadaEn} onChange={e => setVacunaForm(f => f ? { ...f, aplicadaEn: e.target.value } : null)} className="w-full border-2 border-cyan-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-cyan-400" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setVacunaForm(null)} className="flex-1 py-2 rounded-xl text-sm border border-slate-200 text-slate-500">Cancelar</button>
                      <button onClick={guardarVacuna} disabled={savingVacuna} className="flex-1 py-2 rounded-xl text-sm font-bold bg-cyan-500 text-white disabled:opacity-50">{savingVacuna ? "Guardando..." : "Guardar"}</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                <p className="text-sm font-bold text-slate-700">Vacunas para tu edad y pendientes</p>
                <div className="space-y-2">{pendientes.map(v => {
                  const aplicada = yaAplicadas(v.nombre);
                  return (
                    <div key={v.nombre} className={"rounded-2xl border p-3 flex items-center gap-3 " + (aplicada ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                      <span className="text-xl">{aplicada ? "✅" : "⏳"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{v.nombre}</p>
                        <p className="text-xs text-slate-500">{v.etiqueta}</p>
                        {aplicada && aplicada.aplicadaEn && <p className="text-xs text-green-600">{new Date(aplicada.aplicadaEn).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })} · {aplicada.clinica ?? ""}</p>}
                        {aplicada && aplicada.folio && <p className="text-xs text-slate-400">Folio: {aplicada.folio}</p>}
                      </div>
                      {aplicada
                        ? <button onClick={() => eliminarVacuna(aplicada.id)} className="text-xs text-red-400 px-2 py-1 rounded-lg border border-red-200">Borrar</button>
                        : <button onClick={() => setVacunaForm({ nombre: v.nombre, folio: "", aplicadaEn: "", clinica: "", lote: "" })} className="text-xs bg-cyan-500 text-white px-3 py-2 rounded-xl font-bold">Aplicar</button>}
                    </div>
                  );
                })}</div>
              </div>
              {futuras.length > 0 && <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
                <details>
                  <summary className="text-sm font-bold text-slate-500 cursor-pointer">Próximas vacunas ({futuras.length})</summary>
                  <div className="mt-3 space-y-2">{futuras.map(v => (
                    <div key={v.nombre} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                      <span className="text-xl">🔜</span>
                      <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{v.nombre}</p><p className="text-xs text-slate-400">{v.etiqueta}</p></div>
                      <span className="text-xs text-slate-400">en {v.edadMeses - meses} mes{v.edadMeses - meses !== 1 ? "es" : ""}</span>
                    </div>
                  ))}</div>
                </details>
              </div>}
            </div>
          );
        })()}

        {seccion === "perfil" && <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">Información básica</h2>
            <div>
              <label className="text-xs font-semibold text-purple-700 block mb-1">Nombre del bebé</label>
              <input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" />
            </div>
            <div>
              <label className="text-xs font-semibold text-purple-700 block mb-1">Fecha de nacimiento</label>
              <input type="date" value={editNacimiento} onChange={e => setEditNacimiento(e.target.value)} max={hoyStr} className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" />
            </div>
            {savedPerfil && <p className="text-green-600 text-sm text-center font-semibold">Cambios guardados</p>}
            <button onClick={actualizarPerfil} disabled={savingPerfil || !editNombre.trim()} className="w-full py-3 rounded-2xl font-bold bg-purple-500 text-white shadow-md disabled:opacity-50">{savingPerfil ? "Guardando..." : "Guardar cambios"}</button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">Medidas actuales</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
              <div className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">⚖️ Peso</p>
                <p className="font-bold text-slate-700">{baby?.pesoKg ? baby.pesoKg + " kg" : "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">📏 Estatura</p>
                <p className="font-bold text-slate-700">{baby?.estaturaCmd ? baby.estaturaCmd + " cm" : "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-purple-700 block mb-1">Peso (kg)</label>
                <input type="number" step="0.01" value={nuevoPeso} onChange={e => setNuevoPeso(e.target.value)} placeholder="Ej: 5.3" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-700 block mb-1">Estatura (cm)</label>
                <input type="number" step="0.1" value={nuevaEstatura} onChange={e => setNuevaEstatura(e.target.value)} placeholder="Ej: 58.5" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" />
              </div>
            </div>
            <button onClick={guardarMedicion} disabled={savingPeso || (!nuevoPeso && !nuevaEstatura)} className="w-full py-3 rounded-2xl font-bold bg-green-500 text-white shadow-md disabled:opacity-50">{savingPeso ? "Guardando..." : "Guardar medidas"}</button>
            {savedPeso && <p className="text-green-600 text-sm text-center font-semibold">Medidas guardadas y registradas en historial</p>}
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
