'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trophy, LogOut, Flag, Plus, ShieldCheck, Clock, ChevronRight, Gauge } from 'lucide-react';

type FederationAccount = {
  id: string;
  name: string;
  email: string;
  kuerzel?: string;
  region?: string;
  isApproved?: boolean;
  type?: string;
};

type Championship = {
  id: string;
  name: string;
  level: string | null;
  scoring_mode: string;
  event_count: number;
};

export default function FederationDashboard() {
  const router = useRouter();
  const params = useParams();
  const federationId = params?.federationId as string;

  const [account, setAccount] = useState<FederationAccount | null>(null);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const res = await fetch('/api/accounts/session', { cache: 'no-store' });
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();

        // Nur Föderations-Accounts gehören hierher.
        if (data?.type && data.type !== 'federation') {
          router.replace('/login');
          return;
        }
        // IDOR-Schutz: nur das eigene Dashboard.
        if (data?.id && federationId && String(federationId) !== String(data.id)) {
          router.replace(`/dashboard/federation/${data.id}`);
          return;
        }
        setAccount(data);

        // Meisterschaften dieser Föderation laden
        const champRes = await fetch(`/api/championships?federationId=${data.id}`, { cache: 'no-store' });
        if (champRes.ok) {
          const champs = await champRes.json();
          setChampionships(Array.isArray(champs) ? champs : []);
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadAccount();
  }, [router, federationId]);

  const logout = async () => {
    await fetch('/api/accounts/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 font-sans pb-12">
      <nav className="sticky top-0 z-50 bg-[#1e293b]/80 backdrop-blur-md rounded-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Flag className="text-white w-5 h-5" />
            </div>
            <span className="font-black tracking-tighter text-xl uppercase italic">
              {account?.name || 'Föderation'}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">
            {account?.name}
          </h1>
          <p className="text-slate-400 font-medium flex items-center gap-2">
            <Flag className="w-4 h-4 text-teal-400" /> {account?.region || 'Föderation'}
            {account?.isApproved === false && (
              <span className="ml-3 inline-flex items-center gap-1 text-amber-400 text-sm">
                <Clock className="w-3.5 h-3.5" /> Wartet auf Admin-Freigabe
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meisterschaften */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-teal-500 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Meisterschaften
              </h2>
              <button
                onClick={() => router.push(`/dashboard/federation/${federationId}/championships/new`)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl font-black uppercase text-xs transition-all"
              >
                <Plus className="w-4 h-4" /> Neue Meisterschaft
              </button>
            </div>

            {championships.length === 0 ? (
              <div className="bg-[#1e293b] p-12 rounded-3xl text-center border border-slate-800 border-dashed">
                <p className="text-slate-500 font-bold italic">
                  Noch keine Meisterschaften angelegt.
                </p>
                <p className="text-slate-600 text-sm mt-2">
                  Lege eine Landes- oder Regionalmeisterschaft an und verknüpfe mehrere Regatten.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {championships.map((champ) => (
                  <button
                    key={champ.id}
                    onClick={() =>
                      router.push(`/dashboard/federation/${federationId}/championships/${champ.id}`)
                    }
                    className="group flex items-center justify-between bg-[#1e293b] hover:bg-[#2d3a4f] p-5 rounded-3xl border border-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-teal-600/20 border border-teal-500/30 h-12 w-12 rounded-2xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white group-hover:text-teal-400 transition-colors">
                          {champ.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {champ.level ? `${champ.level} · ` : ''}
                          {champ.event_count} {Number(champ.event_count) === 1 ? 'Regatta' : 'Regatten'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info-Karte */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-3xl shadow-xl shadow-teal-900/20">
              <ShieldCheck className="text-white w-10 h-10 mb-3" />
              <h3 className="text-xl font-black text-white leading-tight">Föderations-Konto</h3>
              <p className="text-teal-100 text-sm mt-1">{account?.email}</p>
              <div className="mt-4 border-t border-white/20 pt-3 text-xs text-teal-100 font-mono">
                ID: {account?.id ? `${account.id.slice(0, 8)}…` : '—'}
              </div>
            </div>

            <button
              onClick={() => router.push(`/dashboard/federation/${federationId}/yardstick`)}
              className="w-full flex items-center justify-between bg-[#1e293b] hover:bg-[#2d3a4f] p-5 rounded-3xl border border-slate-800 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-teal-600/20 border border-teal-500/30 h-10 w-10 rounded-xl flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-teal-400" />
                </div>
                <span className="font-bold text-white group-hover:text-teal-400 transition-colors">
                  Yardstick verwalten
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
