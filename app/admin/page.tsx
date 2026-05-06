"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

type Record = { id: string; type: string; formulaMl: number | null; recordedAt: string };
type Baby = { id: string; name: string; records: Record[]; reminders: { id: string }[] };
type User = { id: string; name: string | null; email: string; createdAt: string; babies: Baby[] };

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin").then(r => {
      if (!r.ok) { router.push("/dashboard"); return; }
      return r.json();
    }).then(data => { if (data) setUsers(data); setLoading(false); });
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-purple-50"><p className="text-purple-500">Cargando...</p></div>;

  const totalBebes = users.reduce((s, u) => s + u.babies.length, 0);
  const totalRegistros = users.reduce((s, u) => s + u.babies.reduce((s2, b) => s2 + b.records.length, 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-700">Panel Admin</h1>
          <p className="text-xs text-slate-400">BabyControl</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="text-xs text-slate-400 border rounded-2xl px-3 py-2">Mi cuenta</button>
      </div>
      <div className="px-4 pt-6 pb-20 max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border"><p className="text-2xl font-bold text-purple-600">{users.length}</p><p className="text-xs text-slate-500">Usuarios</p></div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border"><p className="text-2xl font-bold text-blue-600">{totalBebes}</p><p className="text-xs text-slate-500">Bebes</p></div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border"><p className="text-2xl font-bold text-green-600">{totalRegistros}</p><p className="text-xs text-slate-500">Registros</p></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-700">Usuarios registrados</h2>
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <button onClick={() => setExpanded(expanded === u.id ? null : u.id)} className="w-full p-5 flex items-center justify-between">
                <div className="text-left">
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  <p className="text-xs text-slate-400">{u.babies.length} bebe(s) · Registro: {new Date(u.createdAt).toLocaleDateString("es-MX")}</p>
                </div>
                <span className="text-slate-400">{expanded === u.id ? "▲" : "▼"}</span>
              </button>
              {expanded === u.id && <div className="px-5 pb-5 space-y-3 border-t pt-3">
                {u.babies.length === 0 ? <p className="text-sm text-slate-400">Sin bebes registrados.</p> : u.babies.map(b => (
                  <div key={b.id} className="bg-slate-50 rounded-2xl p-3">
                    <p className="font-semibold text-slate-700 text-sm">👶 {b.name}</p>
                    <p className="text-xs text-slate-500">{b.records.length} registros · {b.reminders.length} recordatorios</p>
                  </div>
                ))}
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
