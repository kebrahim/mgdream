import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { setTeamStatus, type SeasonStatus } from "@/lib/status";

const VALID_STATUSES: SeasonStatus[] = ["not_started", "active", "eliminated", "champion"];

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { teamId, year, status, note } = body;

  if (
    typeof teamId !== "number" ||
    typeof year !== "number" ||
    !VALID_STATUSES.includes(status)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await setTeamStatus(teamId, year, status, note);
  return NextResponse.json({ ok: true });
}
