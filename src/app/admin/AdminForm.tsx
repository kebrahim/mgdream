"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearStoredAdminSecret, promptForAdminSecret } from "@/lib/admin-client";
import type { TeamWithStatus } from "@/lib/queries";

const STATUSES = ["not_started", "active", "eliminated", "champion"] as const;

export function AdminForm({ year, roster }: { year: number; roster: TeamWithStatus[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function authorizedFetch(path: string, body: unknown) {
    const secret = promptForAdminSecret();
    if (!secret) return null;

    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      clearStoredAdminSecret();
      window.alert("Incorrect admin secret.");
      return null;
    }
    return res;
  }

  async function updateStatus(teamId: number, status: string) {
    const res = await authorizedFetch("/api/admin/status", { teamId, year, status });
    if (res?.ok) router.refresh();
  }

  async function triggerSync() {
    const secret = window.prompt("Enter the sync secret to trigger a live ESPN sync:");
    if (!secret) return;
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sync?year=${year}`, {
        method: "POST",
        headers: { "x-sync-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed.");
      } else {
        const errors = (data.results as { error?: string }[]).filter((r) => r.error);
        setMessage(
          `Synced ${data.results.length} teams for ${data.year}.` +
            (errors.length ? ` ${errors.length} had issues (see console).` : ""),
        );
        if (errors.length) console.warn("Sync issues:", errors);
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {syncing ? "Syncing…" : `Sync ${year} season from ESPN`}
        </button>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">League</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((team) => (
              <tr key={team.id} className="border-b last:border-0">
                <td className="px-4 py-3">{team.ownerName}</td>
                <td className="px-4 py-3">{team.league}</td>
                <td className="px-4 py-3">{team.name}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={team.status}
                    onChange={(e) => updateStatus(team.id, e.target.value)}
                    className="rounded border px-2 py-1"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
