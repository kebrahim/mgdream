import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { db } from "@/db";
import { dinnerDebts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { debtId, fulfilled } = await req.json();
  if (typeof debtId !== "number" || typeof fulfilled !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db
    .update(dinnerDebts)
    .set({ fulfilled, fulfilledAt: fulfilled ? new Date() : null })
    .where(eq(dinnerDebts.id, debtId));

  return NextResponse.json({ ok: true });
}
