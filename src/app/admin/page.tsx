import { FIRST_SEASON_YEAR, getRosterForYear } from "@/lib/queries";
import { AdminForm } from "./AdminForm";

export const dynamic = "force-dynamic";

function currentYear() {
  return Math.max(new Date().getFullYear(), FIRST_SEASON_YEAR);
}

export default async function AdminPage() {
  const year = currentYear();
  const roster = await getRosterForYear(year);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Admin</h1>
      <p className="mb-6 text-sm text-gray-500">
        Manually override a team&apos;s status, or trigger an ESPN sync. Changes require the
        shared admin secret.
      </p>
      <AdminForm year={year} roster={roster} />
    </div>
  );
}
