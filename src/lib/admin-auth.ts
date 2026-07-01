import { NextRequest } from "next/server";

export function isAuthorizedAdmin(req: NextRequest): boolean {
  const secret = req.headers.get("x-admin-secret");
  return Boolean(process.env.ADMIN_SECRET) && secret === process.env.ADMIN_SECRET;
}
