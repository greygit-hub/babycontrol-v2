import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { medicamentos } = await req.json();
  if (!medicamentos || medicamentos.length === 0) return NextResponse.json({ analisis: null });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ analisis: null, errorHint: "ANTHROPIC_API_KEY no configurada en variables de entorno." });
  const lista = (medicamentos as string[]).filter(Boolean).join(", ");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: `Eres un asistente de salud infantil. Los siguientes medicamentos o suplementos fueron registrados hoy para un bebé: ${lista}. En 2-3 oraciones en español, explica brevemente para qué suele usarse cada uno en bebés, de forma informativa y tranquilizadora. No hagas diagnóstico definitivo. Termina recordando consultar al pediatra.` }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Anthropic API error:", res.status, errBody);
      let errorHint = `Error ${res.status} de Anthropic.`;
      try {
        const errJson = JSON.parse(errBody);
        const msg: string = errJson?.error?.message ?? "";
        if (msg.includes("credit balance") || msg.includes("too low") || msg.includes("billing")) {
          errorHint = "Tu cuenta de Anthropic no tiene créditos. Ve a console.anthropic.com → Plans & Billing para agregar créditos.";
        } else if (msg.includes("invalid") && msg.includes("key")) {
          errorHint = "API key de Anthropic inválida. Verifica la clave en Vercel → Settings → Environment Variables.";
        } else if (msg) {
          errorHint = msg;
        }
      } catch { /* use default errorHint */ }
      return NextResponse.json({ analisis: null, errorHint });
    }
    const data = await res.json();
    return NextResponse.json({ analisis: data.content?.[0]?.text ?? null });
  } catch (e) {
    console.error("Fetch to Anthropic failed:", e);
    return NextResponse.json({ analisis: null, errorHint: "No se pudo conectar con el servidor de IA." });
  }
}
