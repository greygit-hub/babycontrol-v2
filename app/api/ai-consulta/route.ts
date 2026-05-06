import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { medicamentos } = await req.json();
  if (!medicamentos || medicamentos.length === 0) return NextResponse.json({ analisis: null });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ analisis: null });
  const lista = (medicamentos as string[]).filter(Boolean).join(", ");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 280,
      messages: [{ role: "user", content: `Eres un asistente de salud infantil. Los siguientes medicamentos o suplementos fueron registrados hoy para un bebé: ${lista}. En 2-3 oraciones en español, explica brevemente para qué suele usarse cada uno en bebés, de forma informativa y tranquilizadora. No hagas diagnóstico definitivo. Termina recordando consultar al pediatra.` }],
    }),
  });
  if (!res.ok) return NextResponse.json({ analisis: null });
  const data = await res.json();
  return NextResponse.json({ analisis: data.content?.[0]?.text ?? null });
}
