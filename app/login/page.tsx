"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = React.useState<"login" | "registro">("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push("/dashboard");
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    const res2 = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (res2.ok) router.push("/dashboard");
    else { setError("Error al iniciar sesion"); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-6xl mb-3">👶</p>
          <h1 className="text-3xl font-bold text-purple-600">BabyControl</h1>
          <p className="text-slate-500 mt-1">Control inteligente para tu bebe</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setModo("login")} className={"py-2 rounded-2xl font-semibold text-sm " + (modo === "login" ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-600")}>Entrar</button>
            <button onClick={() => setModo("registro")} className={"py-2 rounded-2xl font-semibold text-sm " + (modo === "registro" ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-600")}>Crear cuenta</button>
          </div>
          <form onSubmit={modo === "login" ? handleLogin : handleRegistro} className="space-y-3">
            {modo === "registro" && (
              <div>
                <label className="text-xs font-semibold text-purple-700 block mb-1">Tu nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Maria Garcia" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" required />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-purple-700 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mama@email.com" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-purple-700 block mb-1">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border-2 border-purple-300 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" required />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl p-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-bold text-lg bg-purple-500 text-white shadow-md disabled:opacity-50">
              {loading ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
