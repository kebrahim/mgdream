import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { FIRST_SEASON_YEAR, LEAGUE_ORDER, getRosterForYear } from "@/lib/queries";

export const dynamic = "force-dynamic";

function currentYear() {
  return Math.max(new Date().getFullYear(), FIRST_SEASON_YEAR);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : currentYear();
  const roster = await getRosterForYear(year);

  const owners = [...new Set(roster.map((t) => t.ownerName))].sort();

  const yearOptions: number[] = [];
  for (let y = FIRST_SEASON_YEAR; y <= currentYear() + 1; y++) yearOptions.push(y);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{year} Season</h1>
        <div className="flex gap-1">
          {yearOptions.map((y) => (
            <Link
              key={y}
              href={`/?year=${y}`}
              className={`rounded px-3 py-1 text-sm ${
                y === year ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              } border`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium">Owner</th>
              {LEAGUE_ORDER.map((league) => (
                <th key={league} className="px-4 py-3 font-medium">
                  {league}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {owners.map((ownerName) => (
              <tr key={ownerName} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{ownerName}</td>
                {LEAGUE_ORDER.map((league) => {
                  const team = roster.find(
                    (t) => t.ownerName === ownerName && t.league === league,
                  );
                  return (
                    <td key={league} className="px-4 py-3">
                      {team ? (
                        <div className="flex flex-col gap-1">
                          <span>{team.name}</span>
                          <StatusBadge status={team.status} />
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
