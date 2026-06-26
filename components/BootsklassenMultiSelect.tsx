'use client';

import { useMemo, useState } from 'react';
import { X, Check, Search } from 'lucide-react';
import { BOOTSKLASSEN } from '@/lib/bootsklassen';

/**
 * Mehrfachauswahl von Bootsklassen (z.B. für Meisterschaften).
 * Leere Auswahl = "alle Klassen".
 */
export default function BootsklassenMultiSelect({
  value,
  onChange,
  accent = 'teal',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  accent?: 'blue' | 'teal';
}) {
  const [search, setSearch] = useState('');

  const accentChip = accent === 'teal' ? 'bg-teal-500/20 text-teal-200 border-teal-500/40' : 'bg-blue-500/20 text-blue-200 border-blue-500/40';
  const accentRing = accent === 'teal' ? 'focus:ring-teal-500' : 'focus:ring-blue-500';
  const accentCheck = accent === 'teal' ? 'text-teal-400' : 'text-blue-400';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = BOOTSKLASSEN as readonly string[];
    return q ? list.filter((b) => b.toLowerCase().includes(q)) : list;
  }, [search]);

  const toggle = (klasse: string) => {
    if (value.includes(klasse)) onChange(value.filter((k) => k !== klasse));
    else onChange([...value, klasse]);
  };

  return (
    <div>
      {/* Ausgewählte Chips */}
      {value.length === 0 ? (
        <p className="text-xs text-slate-500 mb-2 italic">Keine Auswahl = alle Bootsklassen werden gewertet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((k) => (
            <span
              key={k}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${accentChip}`}
            >
              {k}
              <button type="button" onClick={() => toggle(k)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suche */}
      <div className="relative mb-2">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Bootsklasse suchen…"
          className={`w-full rounded-xl bg-[#0a192f] text-white text-sm pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 ${accentRing}`}
        />
      </div>

      {/* Liste */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {filtered.map((klasse) => {
          const selected = value.includes(klasse);
          return (
            <button
              type="button"
              key={klasse}
              onClick={() => toggle(klasse)}
              className={`flex items-center justify-between gap-2 text-left text-sm px-3 py-2 rounded-lg border transition-all ${
                selected ? `${accentChip}` : 'bg-[#0a192f]/60 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <span className="truncate" title={klasse}>{klasse}</span>
              {selected && <Check className={`w-3.5 h-3.5 shrink-0 ${accentCheck}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
