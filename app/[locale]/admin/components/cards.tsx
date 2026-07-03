"use client";

export function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-4xl font-extrabold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="w-full bg-[#0a192f]/50 rounded-xl p-2">{children}</div>
    </div>
  );
}

export function EmptyChart() {
  return (
    <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
      Keine Daten für diesen Zeitraum.
    </div>
  );
}
