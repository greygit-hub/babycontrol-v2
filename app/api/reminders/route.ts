import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const babyId = new URL(req.url).searchParams.get("babyId");
  if (!babyId) return NextResponse.json({ error: "babyId requerido" }, { status: 400 });
  const reminders = await prisma.reminder.findMany({ where: { babyId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const { babyId, title, reminderTime, reminderType, isActive } = await req.json();
  const reminder = await prisma.reminder.create({ data: { babyId, title, reminderTime: new Date("1970-01-01T" + reminderTime + ":00"), reminderType, isActive } });
  return NextResponse.json(reminder, { status: 201 });
}
