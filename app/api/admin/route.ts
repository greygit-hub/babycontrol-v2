import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const users = await prisma.user.findMany({ include: { babies: { include: { records: { orderBy: { recordedAt: "desc" }, take: 50 }, reminders: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(users);
}
