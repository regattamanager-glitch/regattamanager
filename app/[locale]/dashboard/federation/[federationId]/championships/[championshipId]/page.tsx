'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Trophy, Plus, Trash2, Calendar, Flag, Search, X, Sailboat, Pencil } from 'lucide-react';
import BootsklassenMultiSelect from '@/components/BootsklassenMultiSelect';

type LinkedEvent = { eventId: string; name: string | null; datumVon: string | null };
type StandingRow = { seglerId: string; name: string; perEvent: (number | null)[]; total: number; rank: number };
type ClassStanding = { klasse: string; events: LinkedEvent[]; rows: StandingRow[] };

type Detail = {
  championship: {
    id: string;
    federationId: string;
    name: string;
    level: string | null;
    scoringMode: string;
    discardCount: number;
    scoringSystem: string;
    racesPerDiscard: number;
    bootsklassen: string[];
  };
  events: LinkedEvent[];
  standings: ClassStanding[];
};

type AvailableEvent = {
  id: string;
  name?: string;
  vereinName?: string;
  datumVon?: string;
  location?: string;
  land?: string;
  bootsklassen?: string[];
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

export default function ChampionshipManagePage() {
  const router = useRouter();
  const params = useParams();
  const federationId = params?.federationId as string;
  const championshipId = params?.championshipId as string;

  const [detail, setDetail] = useState<Detail | null>(null);
  const [available, setAvailable] = useState<AvailableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Bootsklassen-Bearbeitung
  const [editClasses, setEditClasses] = useState(false);
  const [klassenDraft, setKlassenDraft] = useState<string[]>([]);
  const [savingClasses, setSavingClasses] = useState(false);

  // Filter für die Regatten-Auswahl
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
  const notLinked = useMemo(
    () => available.filter((e) => !linkedIds.has(e.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [available, detail?.events]
  );

  // Bootsklassen-Optionen aus den verfügbaren Regatten
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    notLinked.forEach((e) => (e.bootsklassen || []).forEach((b) => b && set.add(b)));
    return [...set].sort();
  }, [notLinked]);

  // Gefilterte Auswahl
  const selectable = useMemo(() => {
    const q = search.trim().toLowerCase();
    const region = regionFilter.trim().toLowerCase();
    return notLinked.filter((e) => {
      if (q) {
        const hay = `${e.name || ''} ${e.vereinName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (classFilter && !(e.bootsklassen || []).includes(classFilter)) return false;
      if (region) {
        const loc = `${e.location || ''} ${e.land || ''}`.toLowerCase();
        if (!loc.includes(region)) return false;
      }
      if (dateFrom && (!e.datumVon || e.datumVon < dateFrom)) return false;
      if (dateTo && (!e.datumVon || e.datumVon > dateTo)) return false;
      return true;
    });
  }, [notLinked, search, classFilter, regionFilter, dateFrom, dateTo]);

  const hasActiveFilter = !!(search || classFilter || regionFilter || dateFrom || dateTo);
  const resetFilters = () => {
    setSearch('');
    setClassFilter('');
    setRegionFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const addEvent = async (eventId: string) => {
    if (!eventId) return;
    setBusy(true);
    try {
      await fetch(`/api/championships/${championshipId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
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

  const startEditClasses = () => {
    setKlassenDraft(detail?.championship.bootsklassen || []);
    setEditClasses(true);
  };

  const saveClasses = async () => {
    setSavingClasses(true);
    try {
      await fetch(`/api/championships/${championshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bootsklassen: klassenDraft }),
      });
      await loadDetail();
      setEditClasses(false);
    } finally {
      setSavingClasses(false);
    }
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
                  {SYSTEM_LABEL[c.scoringSystem] || c.scoringSystem}
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-xs font-bold">
                  {MODE_LABEL[c.scoringMode] || c.scoringMode}
                  {c.scoringMode === 'discard' ? ` (${c.discardCount} Regatten)` : ''}
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

        {/* Gewertete Bootsklassen */}
        <section className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-teal-400 flex items-center gap-2">
              <Sailboat className="w-4 h-4" /> Gewertete Bootsklassen
            </h2>
            {!editClasses && (
              <button
                onClick={startEditClasses}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Bearbeiten
              </button>
            )}
          </div>

          {!editClasses ? (
            c.bootsklassen.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Alle Bootsklassen werden gewertet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {c.bootsklassen.map((k) => (
                  <span
                    key={k}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-teal-500/20 text-teal-200 border-teal-500/40"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )
          ) : (
            <div>
              <BootsklassenMultiSelect value={klassenDraft} onChange={setKlassenDraft} accent="teal" />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={saveClasses}
                  disabled={savingClasses}
                  className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black uppercase text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  {savingClasses ? 'Speichert…' : 'Speichern'}
                </button>
                <button
                  onClick={() => setEditClasses(false)}
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </section>

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

          {/* Regatta suchen & filtern */}
          <div className="border-t border-slate-700/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Regatta hinzufügen
              </h3>
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" /> Filter zurücksetzen
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Suche */}
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Regatta oder Verein suchen…"
                  className="w-full rounded-xl bg-[#0a192f] text-white text-sm pl-10 pr-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {/* Bootsklasse */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded-xl bg-[#0a192f] text-white text-sm px-3 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Alle Bootsklassen</option>
                {classOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {/* Region */}
              <input
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                placeholder="Region / Ort / Land"
                className="rounded-xl bg-[#0a192f] text-white text-sm px-3 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {/* Zeitraum */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 rounded-xl bg-[#0a192f] text-white text-sm px-3 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-slate-500 text-xs">bis</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 rounded-xl bg-[#0a192f] text-white text-sm px-3 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Ergebnisliste */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectable.length === 0 ? (
                <p className="text-slate-500 text-sm italic py-4 text-center">
                  {notLinked.length === 0
                    ? 'Keine weiteren Regatten verfügbar.'
                    : 'Keine Regatta passt zu den Filtern.'}
                </p>
              ) : (
                selectable.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between bg-[#0a192f]/60 rounded-xl px-4 py-3 border border-slate-800"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">
                        {e.name || e.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                        {e.vereinName && <span>{e.vereinName}</span>}
                        {(e.location || e.land) && <span>{[e.location, e.land].filter(Boolean).join(', ')}</span>}
                        {e.datumVon && <span>{new Date(e.datumVon).toLocaleDateString('de-DE')}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => addEvent(e.id)}
                      disabled={busy}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black uppercase text-[10px] px-3 py-2 rounded-lg transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Verknüpfen
                    </button>
                  </div>
                ))
              )}
            </div>
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
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
