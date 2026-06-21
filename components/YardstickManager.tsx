'use client';

import { useEffect, useMemo, useState } from 'react';
import { BOOTSKLASSEN, YARDSTICK_METHODS, type YardstickMethod } from '@/lib/bootsklassen';

/**
 * Wiederverwendbare Yardstick-Verwaltung für Vereine UND Föderationen.
 * Der Owner wird serverseitig aus der Session abgeleitet (kein Prop nötig).
 */
export default function YardstickManager({ accent = 'blue' }: { accent?: 'blue' | 'teal' }) {
  const [method, setMethod] = useState<YardstickMethod>('time_on_time');
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const accentBg = accent === 'teal' ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-500';
  const accentRing = accent === 'teal' ? 'focus:ring-teal-500' : 'focus:ring-blue-500';
  const accentBorder = accent === 'teal' ? 'border-teal-500 bg-teal-500/10' : 'border-blue-500 bg-blue-500/10';

  useEffect(() => {
    fetch('/api/yardstick', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setMethod(d.method || 'time_on_time');
        const strVals: Record<string, string> = {};
        Object.entries(d.values || {}).forEach(([k, v]) => (strVals[k] = String(v)));
        setValues(strVals);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return BOOTSKLASSEN as readonly string[];
    return (BOOTSKLASSEN as readonly string[]).filter((b) => b.toLowerCase().includes(q));
  }, [search]);

  const setValue = (klasse: string, val: string) => {
    setValues((prev) => ({ ...prev, [klasse]: val }));
    setSavedMsg('');
  };

  const save = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const numericValues: Record<string, number> = {};
      Object.entries(values).forEach(([k, v]) => {
        const n = Number(v);
        if (v !== '' && Number.isFinite(n) && n > 0) numericValues[k] = n;
      });
      const res = await fetch('/api/yardstick', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, values: numericValues }),
      });
      if (!res.ok) throw new Error();
      setSavedMsg('Gespeichert ✓');
    } catch {
      setSavedMsg('Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-24 rounded-lg bg-[#0a192f] text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 ${accentRing}`;
  const configuredCount = Object.values(values).filter((v) => v !== '' && Number(v) > 0).length;

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-500">
        <div className="w-6 h-6 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Berechnungsart */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Berechnungsart
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          {YARDSTICK_METHODS.map((m) => (
            <label
              key={m.value}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                method === m.value ? accentBorder : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="ystMethod"
                checked={method === m.value}
                onChange={() => {
                  setMethod(m.value);
                  setSavedMsg('');
                }}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-white text-sm">{m.label}</div>
                <div className="text-xs text-slate-400">{m.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Klassen-Koeffizienten */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
            Yardstickzahl pro Bootsklasse ({configuredCount} gesetzt)
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Klasse suchen…"
            className={`rounded-lg bg-[#0a192f] text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 ${accentRing}`}
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map((klasse) => (
            <div
              key={klasse}
              className="flex items-center justify-between gap-2 bg-[#0a192f]/60 border border-slate-800 rounded-xl px-3 py-2"
            >
              <span className="text-sm text-slate-200 truncate" title={klasse}>{klasse}</span>
              <input
                type="number"
                min={1}
                step="0.01"
                value={values[klasse] ?? ''}
                onChange={(e) => setValue(klasse, e.target.value)}
                placeholder="100"
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Leer = Standard (100). Nur Klassen mit gesetzter Zahl werden gespeichert.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className={`${accentBg} disabled:opacity-50 text-white font-black uppercase tracking-wide text-sm px-6 py-3 rounded-xl transition-all`}
        >
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
        {savedMsg && <span className="text-sm text-slate-300">{savedMsg}</span>}
      </div>
    </div>
  );
}
