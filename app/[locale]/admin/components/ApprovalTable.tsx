"use client";

type Column<Row> = {
  header: string;
  className?: string;
  render: (row: Row) => React.ReactNode;
};

/**
 * Generische Freigabe-Tabelle für Vereine und Föderationen:
 * beliebige Spalten plus eine Status-Spalte mit Freischalten/Sperren-Button.
 */
export default function ApprovalTable<Row extends { id: string; isApproved: boolean }>({
  rows,
  columns,
  emptyText,
  updatingId,
  onToggle,
}: {
  rows: Row[];
  columns: Column<Row>[];
  emptyText: string;
  updatingId: string | null;
  onToggle: (id: string, currentStatus: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className="p-4">{col.header}</th>
              ))}
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#0b3d91]/20 transition-colors">
                  {columns.map((col) => (
                    <td key={col.header} className={`p-4 ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                  <td className="p-4 text-center">
                    <button
                      disabled={updatingId === row.id}
                      onClick={() => onToggle(row.id, row.isApproved)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${
                        row.isApproved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40"
                          : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                      }`}
                    >
                      {updatingId === row.id
                        ? "Speichert..."
                        : row.isApproved
                        ? "✓ Freigeschaltet"
                        : "⏳ Gesperrt"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
