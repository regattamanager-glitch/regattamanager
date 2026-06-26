'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Trophy } from 'lucide-react';
import BootsklassenMultiSelect from '@/components/BootsklassenMultiSelect';

const SCORING_MODES = [
  { value: 'sum', label: 'Summe aller Regatten', hint: 'Alle Regatta-Ergebnisse werden addiert.' },
  { value: 'discard', label: 'Summe mit Streichern', hint: 'Wie Summe, aber die schlechtesten X Regatten werden gestrichen.' },
  { value: 'best', label: 'Nur beste Regatta', hint: 'Nur das beste Einzelergebnis zählt.' },
] as const;

const SCORING_SYSTEMS = [
  { value: 'low_point', label: 'Low-Point', hint: 'Platz = Punkte, wenig ist besser (Standard).' },
  { value: 'high_point', label: 'High-Point', hint: 'Der 1. bekommt die meisten Punkte, viel ist besser.' },
  { value: 'bonus_point', label: 'Bonus-Point', hint: 'Klassische Bonus-Punkte-Tabelle (1.=0, 2.=3, 3.=5,7 …).' },
] as const;

export default function NewChampionshipPage() {
  const router = useRouter();
  const params = useParams();
  const federationId = params?.federationId as string;

  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [scoringMode, setScoringMode] = useState<'sum' | 'discard' | 'best'>('sum');
  const [discardCount, setDiscardCount] = useState(1);
  const [scoringSystem, setScoringSystem] = useState<'low_point' | 'high_point' | 'bonus_point'>('low_point');
  const [racesPerDiscard, setRacesPerDiscard] = useState(4);
  const [bootsklassen, setBootsklassen] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          level,
          scoring_mode: scoringMode,
          discard_count: scoringMode === 'discard' ? discardCount : 0,
          scoring_system: scoringSystem,
          races_per_discard: racesPerDiscard,
          bootsklassen,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Anlegen fehlgeschlagen.');
      }
      router.replace(`/dashboard/federation/${federationId}/championships/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anlegen fehlgeschlagen.');
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-xl bg-[#0a192f] text-white text-sm px-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500';

  return (
    <div className="min-h-screen bg-[#0a192f]/90 md:rounded-[2.5rem] text-white p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/federation/${federationId}`)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Zurück zum Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-teal-600 p-2.5 rounded-xl">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Neue Meisterschaft</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl p-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Name der Meisterschaft
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Landesmeisterschaft 2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Ebene (optional)
            </label>
            <input
              className={inputCls}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="z.B. Landesmeisterschaft, Regionalmeisterschaft"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Wertungsmodus
            </label>
            <div className="space-y-2">
              {SCORING_MODES.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    scoringMode === m.value
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="scoringMode"
                    value={m.value}
                    checked={scoringMode === m.value}
                    onChange={() => setScoringMode(m.value)}
                    className="mt-1 accent-teal-500"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{m.label}</div>
                    <div className="text-xs text-slate-400">{m.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {scoringMode === 'discard' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Gestrichene Regatten
              </label>
              <input
                type="number"
                min={0}
                className={`${inputCls} w-32`}
                value={discardCount}
                onChange={(e) => setDiscardCount(Math.max(0, Number(e.target.value)))}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Wertungssystem
            </label>
            <div className="space-y-2">
              {SCORING_SYSTEMS.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    scoringSystem === s.value
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="scoringSystem"
                    value={s.value}
                    checked={scoringSystem === s.value}
                    onChange={() => setScoringSystem(s.value)}
                    className="mt-1 accent-teal-500"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{s.label}</div>
                    <div className="text-xs text-slate-400">{s.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Streicher pro Klasse
            </label>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>1 Streichresultat je</span>
              <input
                type="number"
                min={0}
                className={`${inputCls} w-20`}
                value={racesPerDiscard}
                onChange={(e) => setRacesPerDiscard(Math.max(0, Number(e.target.value)))}
              />
              <span>Wettfahrten</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Skaliert je Klasse mit deren Rennanzahl. 0 = keine Streicher.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Gewertete Bootsklassen
            </label>
            <BootsklassenMultiSelect value={bootsklassen} onChange={setBootsklassen} accent="teal" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black uppercase tracking-wide py-3.5 rounded-xl transition-all"
          >
            {saving ? 'Wird angelegt…' : 'Meisterschaft anlegen'}
          </button>
        </form>
      </div>
    </div>
  );
}
