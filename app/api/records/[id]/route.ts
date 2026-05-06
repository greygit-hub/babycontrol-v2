import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { formulaMl, pechoMin, notes, recordedAt } = await req.json();
  const record = await prisma.record.update({
    where: { id },
    data: { formulaMl: formulaMl ?? null, pechoMin: pechoMin ?? null, notes: notes ?? null, ...(recordedAt ? { recordedAt: new Date(recordedAt) } : {}) },
  });
  return NextResponse.json(record);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.record.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
