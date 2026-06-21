'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Trophy, Plus, Trash2, Calendar, Flag } from 'lucide-react';

type LinkedEvent = { eventId: string; name: string | null; datumVon: string | null };
type StandingRow = { seglerId: string; name: string; perEvent: (number | null)[]; total: number; rank: number };
type ClassStanding = { klasse: string; rows: StandingRow[] };

type Detail = {
  championship: {
    id: string;
    federationId: string;
    name: string;
    level: string | null;
    scoringMode: string;
    discardCount: number;
    bootsklassen: string[];
  };
  events: LinkedEvent[];
  standings: ClassStanding[];
};

type AvailableEvent = { id: string; name?: string; vereinName?: string; datumVon?: string };

const MODE_LABEL: Record<string, string> = {
  sum: 'Summe aller Regatten',
  discard: 'Summe mit Streichern',
  best: 'Nur beste Regatta',
};

export default function ChampionshipManagePage() {
  const router = useRouter();
  const params = useParams();
  const federationId = params?.federationId as string;
  const championshipId = params?.championshipId as string;

  const [detail, setDetail] = useState<Detail | null>(null);
  const [available, setAvailable] = useState<AvailableEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadDetail = useCallback(async () => {
    const res = await fetch(`/api/championships/${championshipId}`, { cache: 'no-store' });
    if (res.ok) setDetail(await res.json());
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    loadDetail();
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => setAvailable(Array.isArray(d) ? d : []))
      .catch(() => setAvailable([]));
  }, [loadDetail]);

  const linkedIds = new Set((detail?.events || []).map((e) => e.eventId));
  const selectable = available.filter((e) => !linkedIds.has(e.id));

  const addEvent = async () => {
    if (!selectedEvent) return;
    setBusy(true);
    try {
      await fetch(`/api/championships/${championshipId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent }),
      });
      setSelectedEvent('');
      await loadDetail();
    } finally {
      setBusy(false);
    }
  };

  const removeEvent = async (eventId: string) => {
    setBusy(true);
    try {
      await fetch(`/api/championships/${championshipId}/events?eventId=${eventId}`, {
        method: 'DELETE',
      });
      await loadDetail();
    } finally {
      setBusy(false);
    }
  };

  const deleteChampionship = async () => {
    if (!confirm('Diese Meisterschaft wirklich löschen?')) return;
    await fetch(`/api/championships/${championshipId}`, { method: 'DELETE' });
    router.replace(`/dashboard/federation/${federationId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center text-white">
        Meisterschaft nicht gefunden.
      </div>
    );
  }

  const c = detail.championship;

  return (
    <div className="min-h-screen bg-[#0a192f]/90 md:rounded-[2.5rem] text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/federation/${federationId}`)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Zurück zum Dashboard
        </button>

        {/* Kopf */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2.5 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{c.name}</h1>
              <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                {c.level && <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5 text-teal-400" /> {c.level}</span>}
                <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-xs font-bold">
                  {MODE_LABEL[c.scoringMode] || c.scoringMode}
                  {c.scoringMode === 'discard' ? ` (${c.discardCount} Streicher)` : ''}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={deleteChampionship}
            className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Löschen
          </button>
        </div>

        {/* Regatten verknüpfen */}
        <section className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl p-6 mb-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-teal-400 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Verknüpfte Regatten ({detail.events.length})
          </h2>

          {detail.events.length === 0 ? (
            <p className="text-slate-500 text-sm italic mb-4">Noch keine Regatten verknüpft.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {detail.events.map((ev) => (
                <div
                  key={ev.eventId}
                  className="flex items-center justify-between bg-[#0a192f]/60 rounded-xl px-4 py-3 border border-slate-800"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{ev.name || ev.eventId.slice(0, 8)}</div>
                    {ev.datumVon && (
                      <div className="text-xs text-slate-500">
                        {new Date(ev.datumVon).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeEvent(ev.eventId)}
                    disabled={busy}
                    className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="flex-1 rounded-xl bg-[#0a192f] text-white text-sm px-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Regatta auswählen…</option>
              {selectable.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || e.id.slice(0, 8)}
                  {e.vereinName ? ` — ${e.vereinName}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={addEvent}
              disabled={!selectedEvent || busy}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black uppercase text-xs px-5 py-3 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Verknüpfen
            </button>
          </div>
        </section>

        {/* Gesamtwertung */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-teal-400 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Gesamtwertung
          </h2>

          {detail.standings.length === 0 ? (
            <div className="bg-[#112d5c]/40 border border-slate-700/50 border-dashed rounded-3xl p-10 text-center text-slate-500 text-sm">
              Noch keine Wertung – verknüpfe Regatten mit veröffentlichten Ergebnissen.
            </div>
          ) : (
            <div className="space-y-8">
              {detail.standings.map((cls) => (
                <div key={cls.klasse} className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700/50 bg-[#0b3d91]/30">
                    <h3 className="font-black text-white">{cls.klasse}</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-3">Rang</th>
                        <th className="px-6 py-3">Segler</th>
                        {detail.events.map((ev, i) => (
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
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
