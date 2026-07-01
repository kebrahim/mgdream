"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearStoredAdminSecret, promptForAdminSecret } from "@/lib/admin-client";

type Debt = {
  id: number;
  fulfilled: boolean;
  year: number;
  teamName: string;
  league: string;
  debtorName: string;
  creditorName: string;
};

export function DinnerDebtRow({ debt }: { debt: Debt }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggleFulfilled() {
    const secret = promptForAdminSecret();
    if (!secret) return;

    setPending(true);
    const res = await fetch("/api/admin/dinner-debts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ debtId: debt.id, fulfilled: !debt.fulfilled }),
    });
    setPending(false);

    if (res.status === 401) {
      clearStoredAdminSecret();
      window.alert("Incorrect admin secret.");
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">{debt.year}</td>
      <td className="px-4 py-3">
        {debt.league} — {debt.teamName}
      </td>
      <td className="px-4 py-3">{debt.debtorName}</td>
      <td className="px-4 py-3">{debt.creditorName}</td>
      <td className="px-4 py-3">
        <button
          onClick={toggleFulfilled}
          disabled={pending}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            debt.fulfilled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {debt.fulfilled ? "Paid ✓" : "Outstanding"}
        </button>
      </td>
    </tr>
  );
}
