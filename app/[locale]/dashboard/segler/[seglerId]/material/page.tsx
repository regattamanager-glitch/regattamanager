'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft, Plus, Trash2, Clock, Wrench, AlertTriangle, ChevronDown, Anchor, Gauge,
} from 'lucide-react';
import { BOOTSKLASSEN } from '@/lib/bootsklassen';

type Equipment = {
  id: string;
  klasse: string | null;
  part_type: string;
  name: string;
  identifier: string | null;
  hours: number;
  purchased_at: string | null;
  service_interval_hours: number | null;
  status: string;
  notes: string | null;
};

type LogEntry = {
  id: string;
  type: string;
  hours_added: number | null;
  description: string | null;
  logged_at: string;
};

const PART_TYPES = [
  { value: 'boat', label: 'Rumpf / Boot' },
  { value: 'sail', label: 'Segel' },
  { value: 'mast', label: 'Mast' },
  { value: 'foil', label: 'Foil' },
  { value: 'foilboard', label: 'Foilboard' },
  { value: 'sheet', label: 'Schot' },
  { value: 'other', label: 'Sonstiges' },
];
const PART_LABEL: Record<string, string> = Object.fromEntries(PART_TYPES.map((p) => [p.value, p.label]));

const emptyForm = { name: '', part_type: 'sail', klasse: '', identifier: '', hours: '', service_interval_hours: '' };

export default function MaterialPage() {
  const router = useRouter();
  const params = useParams();
  const seglerId = params?.seglerId as string;

  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/equipment', { cache: 'no-store' });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          part_type: form.part_type,
          klasse: form.klasse || null,
          identifier: form.identifier || null,
          hours: form.hours ? Number(form.hours) : 0,
          service_interval_hours: form.service_interval_hours ? Number(form.service_interval_hours) : null,
        }),
      });
      setForm({ ...emptyForm });
      setShowAdd(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const removeEquipment = async (id: string) => {
    if (!confirm('Dieses Material wirklich löschen?')) return;
    await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
    await load();
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!logs[id]) {
      const res = await fetch(`/api/equipment/${id}/log`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs((p) => ({ ...p, [id]: data }));
      }
    }
  };

  const addHours = async (id: string) => {
    const val = prompt('Wie viele Stunden hinzufügen?');
    const h = Number(val);
    if (!val || !Number.isFinite(h) || h <= 0) return;
    await fetch(`/api/equipment/${id}/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'hours', hours_added: h, description: 'Trainings-/Regatta-Stunden' }),
    });
    setLogs((p) => { const c = { ...p }; delete c[id]; return c; });
    if (expanded === id) await toggleExpand(id);
    await load();
  };

  const addMaintenance = async (id: string) => {
    const desc = prompt('Wartung / Reparatur – was wurde gemacht?');
    if (!desc) return;
    await fetch(`/api/equipment/${id}/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'maintenance', description: desc }),
    });
    setLogs((p) => { const c = { ...p }; delete c[id]; return c; });
    if (expanded === id) await toggleExpand(id);
  };

  const serviceDue = (it: Equipment) =>
    it.service_interval_hours != null && it.service_interval_hours > 0 && it.hours >= it.service_interval_hours;

  const inputCls = 'w-full rounded-xl bg-[#0a192f] text-white text-sm px-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500';

  return (
    <div className="min-h-screen bg-[#0a192f]/90 md:rounded-[2.5rem] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/segler/${seglerId}`)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Zurück zum Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl"><Anchor className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">RigLog</h1>
              <p className="text-slate-400 text-sm">Dein Material – Stunden & Wartung im Blick.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-black uppercase text-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Material
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addEquipment} className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl p-6 mb-8 grid sm:grid-cols-2 gap-4">
            <input className={inputCls} placeholder="Bezeichnung (z.B. Mainsail North)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select className={inputCls} value={form.part_type} onChange={(e) => setForm({ ...form, part_type: e.target.value })}>
              {PART_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select className={inputCls} value={form.klasse} onChange={(e) => setForm({ ...form, klasse: e.target.value })}>
              <option value="">Bootsklasse (optional)</option>
              {(BOOTSKLASSEN as readonly string[]).map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input className={inputCls} placeholder="Segel-/Rumpfnummer (optional)" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
            <input className={inputCls} type="number" min={0} step="0.1" placeholder="Stunden (aktuell)" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            <input className={inputCls} type="number" min={0} step="1" placeholder="Wartung fällig alle … Std (optional)" value={form.service_interval_hours} onChange={(e) => setForm({ ...form, service_interval_hours: e.target.value })} />
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase text-xs px-5 py-3 rounded-xl">
                {saving ? 'Speichert…' : 'Anlegen'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-sm">Abbrechen</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#112d5c]/40 border border-slate-700/50 border-dashed rounded-3xl p-12 text-center text-slate-500">
            Noch kein Material erfasst. Lege dein erstes Teil an.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-5">
                  <button onClick={() => toggleExpand(it.id)} className="flex items-center gap-4 text-left min-w-0">
                    <div className="bg-blue-600/15 border border-blue-500/30 h-11 w-11 rounded-xl flex items-center justify-center shrink-0">
                      <Gauge className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-white truncate flex items-center gap-2">
                        {it.name}
                        {serviceDue(it) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Wartung fällig
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                        <span>{PART_LABEL[it.part_type] || it.part_type}</span>
                        {it.klasse && <span>{it.klasse}</span>}
                        {it.identifier && <span className="font-mono">{it.identifier}</span>}
                        <span className="text-blue-300 font-bold">{Number(it.hours).toFixed(1)} h</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => addHours(it.id)} title="Stunden hinzufügen" className="p-2 text-blue-300 hover:bg-blue-500/10 rounded-lg"><Clock className="w-4 h-4" /></button>
                    <button onClick={() => addMaintenance(it.id)} title="Wartung/Reparatur" className="p-2 text-emerald-300 hover:bg-emerald-500/10 rounded-lg"><Wrench className="w-4 h-4" /></button>
                    <button onClick={() => removeEquipment(it.id)} title="Löschen" className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => toggleExpand(it.id)} className="p-2 text-slate-400 hover:bg-slate-700/40 rounded-lg">
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded === it.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {expanded === it.id && (
                  <div className="border-t border-slate-700/50 px-5 py-4 bg-[#0a192f]/40">
                    {it.service_interval_hours ? (
                      <p className="text-xs text-slate-400 mb-3">
                        Wartungsintervall: alle {Number(it.service_interval_hours).toFixed(0)} h
                        {serviceDue(it) ? ' — überfällig!' : ''}
                      </p>
                    ) : null}
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Historie</h4>
                    {!logs[it.id] ? (
                      <p className="text-xs text-slate-500">Lädt…</p>
                    ) : logs[it.id].length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Noch keine Einträge.</p>
                    ) : (
                      <div className="space-y-2">
                        {logs[it.id].map((l) => (
                          <div key={l.id} className="flex items-start gap-3 text-sm">
                            <span className="text-[10px] text-slate-500 font-mono pt-0.5 w-20 shrink-0">
                              {new Date(l.logged_at).toLocaleDateString('de-DE')}
                            </span>
                            {l.type === 'hours' ? (
                              <span className="text-blue-300"><Clock className="w-3 h-3 inline mr-1" />+{Number(l.hours_added).toFixed(1)} h</span>
                            ) : (
                              <span className="text-slate-200">
                                <Wrench className="w-3 h-3 inline mr-1 text-emerald-400" />{l.description}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
