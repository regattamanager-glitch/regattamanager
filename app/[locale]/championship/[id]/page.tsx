'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trophy, Calendar, Flag } from 'lucide-react';

type StandingRow = { seglerId: string; name: string; perEvent: (number | null)[]; total: number; rank: number };
type ClassStanding = { klasse: string; events: LinkedEvent[]; rows: StandingRow[] };
type LinkedEvent = { eventId: string; name: string | null; datumVon: string | null };

type Detail = {
  championship: { id: string; name: string; level: string | null; scoringMode: string; discardCount: number; scoringSystem?: string };
  events: LinkedEvent[];
  standings: ClassStanding[];
};

const MODE_LABEL: Record<string, string> = {
  sum: 'Summe aller Regatten',
  discard: 'Summe mit Streichern',
  best: 'Nur beste Regatta',
};

const SYSTEM_LABEL: Record<string, string> = {
  low_point: 'Low-Point',
  high_point: 'High-Point',
  bonus_point: 'Bonus-Point',
};

export default function PublicChampionshipPage() {
  const params = useParams();
  const id = params?.id as string;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/championships/${id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70">
        Meisterschaft nicht gefunden.
      </div>
    );
  }

  const c = detail.championship;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-teal-600 p-2.5 rounded-xl">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">{c.name}</h1>
      </div>
      <p className="text-slate-400 text-sm flex items-center gap-3 mb-8 ml-1">
        {c.level && <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5 text-teal-400" /> {c.level}</span>}
        {c.scoringSystem && (
          <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-xs font-bold">
            {SYSTEM_LABEL[c.scoringSystem] || c.scoringSystem}
          </span>
        )}
        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-xs font-bold">
          {MODE_LABEL[c.scoringMode] || c.scoringMode}
          {c.scoringMode === 'discard' ? ` (${c.discardCount} Regatten)` : ''}
        </span>
      </p>

      {/* Regatten */}
      <div className="flex flex-wrap gap-2 mb-10">
        {detail.events.map((ev, i) => (
          <span
            key={ev.eventId}
            className="inline-flex items-center gap-1.5 bg-[#112d5c]/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
          >
            <Calendar className="w-3 h-3 text-teal-400" /> R{i + 1}: {ev.name || ev.eventId.slice(0, 8)}
          </span>
        ))}
      </div>

      {detail.standings.length === 0 ? (
        <div className="bg-[#112d5c]/40 border border-slate-700/50 border-dashed rounded-3xl p-10 text-center text-slate-500 text-sm">
          Noch keine Wertung verfügbar.
        </div>
      ) : (
        <div className="space-y-8">
          {detail.standings.map((cls) => (
            <div key={cls.klasse} className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-[#0b3d91]/30">
                <h3 className="font-black text-white">{cls.klasse}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-3">Rang</th>
                      <th className="px-6 py-3">Segler</th>
                      {cls.events.map((ev, i) => (
                        <th key={ev.eventId} className="px-3 py-3 text-center" title={ev.name || ''}>
                          R{i + 1}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cls.rows.map((row) => (
                      <tr key={row.seglerId} className={row.rank <= 3 ? 'bg-teal-500/5' : ''}>
                        <td className="px-6 py-3 font-black italic text-lg">
                          {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `${row.rank}.`}
                        </td>
                        <td className="px-6 py-3 font-bold text-white">{row.name}</td>
                        {row.perEvent.map((p, i) => (
                          <td key={i} className="px-3 py-3 text-center text-slate-300">
                            {p ?? '–'}
                          </td>
                        ))}
                        <td className="px-6 py-3 text-right font-mono font-bold text-teal-300">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
