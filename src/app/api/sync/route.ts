import { NextRequest, NextResponse } from "next/server";
import { syncAllLeagues } from "@/lib/sync";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const results = await syncAllLeagues(year);
  return NextResponse.json({ year, results });
}
