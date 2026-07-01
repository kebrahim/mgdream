const STYLES: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  active: "bg-blue-100 text-blue-700",
  eliminated: "bg-red-100 text-red-700",
  champion: "bg-amber-100 text-amber-800",
};

const LABELS: Record<string, string> = {
  not_started: "Not Started",
  active: "Active",
  eliminated: "Eliminated",
  champion: "🏆 Champion",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? STYLES.not_started
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
