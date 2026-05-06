"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string | null; email: string; isAdmin: boolean };
type Baby = { id: string; name: string; fotoUrl: string | null };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [babies, setBabies] = React.useState<Baby[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [babyName, setBabyName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [pesoKg, setPesoKg] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return; }
      return r.json();
    }).then(data => { if (data) setUser(data); });
    fetch("/api/babies").then(r => r.ok ? r.json() : []).then(setBabies);
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function crearBebe(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/babies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: babyName, birthDate, pesoKg: parseFloat(pesoKg) }) });
    if (res.ok) {
      const baby = await res.json();
      setBabies(prev => [baby, ...prev]);
      setBabyName(""); setBirthDate(""); setPesoKg(""); setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-purple-600">BabyControl</h1>
          <p className="text-xs text-slate-400">Hola, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          {user?.isAdmin && <button onClick={() => router.push("/admin")} className="text-xs text-purple-500 border border-purple-300 rounded-2xl px-3 py-2">Admin</button>}
          <button onClick={logout} className="text-xs text-slate-400 border rounded-2xl px-3 py-2">Salir</button>
        </div>
      </div>
      <div className="px-4 pt-6 pb-20 space-y-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-slate-700">Mis bebes</h2>
        {babies.length === 0 && !showForm && (
          <div className="bg-white rounded-3xl border p-8 text-center space-y-3">
            <p className="text-5xl">👶</p>
            <p className="text-slate-500">Aun no tienes bebes registrados</p>
          </div>
        )}
        {babies.map(b => (
          <button key={b.id} onClick={() => router.push("/bebe/" + b.id)} className="w-full bg-white rounded-3xl border p-5 flex items-center gap-4 shadow-sm">
            {b.fotoUrl ? <img src={b.fotoUrl} alt={b.name} className="w-14 h-14 rounded-full object-cover border-2 border-purple-300" /> : <div className="w-14 h-14 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-2xl">👶</div>}
            <div className="text-left">
              <p className="font-bold text-slate-800 text-lg">{b.name}</p>
              <p className="text-sm text-purple-500">Ver registros</p>
            </div>
          </button>
        ))}
        {showForm ? (
          <div className="bg-white rounded-3xl border p-5 space-y-4">
            <h3 className="font-bold text-slate-700">Registrar bebe</h3>
            <form onSubmit={crearBebe} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nombre</label><input value={babyName} onChange={e => setBabyName(e.target.value)} placeholder="Sarilu" className="w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" required /></div>
              <div><label className="text-xs font-semibold text-slate-500 block mb-1">Fecha de nacimiento</label><input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" required /></div>
              <div><label className="text-xs font-semibold text-slate-500 block mb-1">Peso actual (kg)</label><input type="number" step="0.1" value={pesoKg} onChange={e => setPesoKg(e.target.value)} placeholder="3.5" className="w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="py-3 rounded-2xl border font-semibold text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={saving} className="py-3 rounded-2xl bg-purple-500 text-white font-semibold text-sm disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-3xl border-2 border-dashed border-purple-300 text-purple-500 font-semibold text-sm">+ Agregar bebe</button>
        )}
      </div>
    </div>
  );
}
