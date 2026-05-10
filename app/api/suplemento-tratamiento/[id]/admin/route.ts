import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const admin = await prisma.suplementoAdmin.create({
    data: {
      tratamientoId: id,
      ...(body.notas ? { notas: body.notas } : {}),
      ...(body.administradoEn ? { administradoEn: new Date(body.administradoEn) } : {}),
    },
  });
  return NextResponse.json(admin);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { adminId } = await req.json();
  await prisma.suplementoAdmin.delete({ where: { id: adminId, tratamientoId: id } });
  return NextResponse.json({ ok: true });
}
