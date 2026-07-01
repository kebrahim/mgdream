import { getChampionshipHistory, getDinnerLedger } from "@/lib/queries";
import { DinnerDebtRow } from "./DinnerDebtRow";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [champions, debts] = await Promise.all([
    getChampionshipHistory(),
    getDinnerLedger(),
  ]);

  const outstandingByOwner = new Map<string, number>();
  for (const d of debts) {
    if (!d.fulfilled) {
      outstandingByOwner.set(d.debtorName, (outstandingByOwner.get(d.debtorName) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-4 text-2xl font-semibold">Champions</h1>
        {champions.length === 0 ? (
          <p className="text-gray-500">No championships recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {champions.map((c) => (
              <li
                key={`${c.year}-${c.league}`}
                className="rounded-lg border bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {c.year} {c.league} Champion: {c.teamName}
                </span>{" "}
                <span className="text-gray-500">(owned by {c.ownerName})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h1 className="mb-4 text-2xl font-semibold">Dinner Ledger</h1>
        {outstandingByOwner.size > 0 && (
          <div className="mb-4 rounded-lg border bg-amber-50 px-4 py-3 text-sm">
            <span className="font-medium">Outstanding: </span>
            {[...outstandingByOwner.entries()]
              .map(([name, count]) => `${name} owes ${count} dinner${count > 1 ? "s" : ""}`)
              .join(", ")}
          </div>
        )}
        {debts.length === 0 ? (
          <p className="text-gray-500">No dinners owed yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Champion</th>
                  <th className="px-4 py-3 font-medium">Owes</th>
                  <th className="px-4 py-3 font-medium">Owed To</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <DinnerDebtRow key={d.id} debt={d} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
