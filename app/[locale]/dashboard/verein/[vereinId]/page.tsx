'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Calendar, 
  PlusCircle, 
  Settings, 
  LogOut, 
  Trophy, 
  Edit3, 
  ChevronRight, 
  LayoutDashboard,
  Anchor
} from 'lucide-react';
import dayjs from 'dayjs';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTranslations } from 'next-intl';

type Event = {
  id: string;          
  vereinId: string;    
  name: string;
  datumVon: string;
  datumBis: string;
  location: string;
  land?: string;
}; 

type Account = {
  id: string;
  name: string;
  email: string;
};

export default function VereinsDashboard() {
  const t = useTranslations("VereinsDashboard");
  const router = useRouter();
  const params = useParams();
  const vereinId = params.vereinId;

  const [account, setAccount] = useState<Account | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const res = await fetch('/api/accounts/session');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setAccount(data);
      } catch (err) {
        router.push('/login');
      }
    };
    loadAccount();
  }, [router]);

  useEffect(() => {
    if (!vereinId) return;
    const loadEvents = async () => {
      try {
        const res = await fetch(`/api/events?vereinId=${vereinId}`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [vereinId]);

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const kommende = events.filter(e => dayjs(e.datumVon).isAfter(dayjs()));
  const vergangene = events.filter(e => dayjs(e.datumBis).isBefore(dayjs()));

  return (
    <div className="min-h-screen p-0 md:p-4"> 
      <div className="min-h-[calc(100vh-2rem)] bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 font-sans shadow-2xl overflow-hidden border border-slate-800 flex flex-col">
        
        {/* Navbar */}
        <nav className="bg-[#1e293b]/50 backdrop-blur-md border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Anchor className="text-white w-6 h-6" />
              </div>
              <span className="font-black tracking-tighter text-2xl uppercase italic">
                Regatta<span className="text-blue-500">Manager</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/dashboard/verein/${vereinId}/create`)}
                className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" /> {t('nav.createEvent')}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-3 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 shadow-inner"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-4 w-60 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
                    <MenuLink icon={<LayoutDashboard size={18} />} label={t('nav.dashboard')} onClick={() => router.push(`/dashboard/verein/${vereinId}`)} />
                    <MenuLink icon={<PlusCircle size={18} />} label={t('nav.newEvent')} onClick={() => router.push(`/dashboard/verein/${vereinId}/create`)} />
                    <MenuLink icon={<Trophy size={18} />} label={t('nav.performance')} onClick={() => router.push(`/dashboard/verein/${vereinId}/athlet/performance`)} />
                    <MenuLink icon={<GroupsIcon />} label={t('nav.members')} onClick={() => router.push(`/dashboard/verein/${vereinId}/vereinsMitglieder`)} />
                    <MenuLink icon={<Settings size={18} />} label={t('nav.profile')} onClick={() => router.push(`/dashboard/verein/${vereinId}/profil`)} />
                    <hr className="border-slate-700 my-2" />
                    <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 font-bold transition-colors">
                      <LogOut size={18} /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full px-6 md:px-10 pt-10 pb-20">
          
          {/* Header Section */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">{t('header.management')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                {t('header.title')}
              </h1>
              <p className="text-slate-400 font-medium flex items-center gap-2 text-xl">
                {t('header.welcome', { name: account?.name || '...' })}
              </p>
            </div>
            
            <div className="flex gap-4">
              <StatCard label={t('header.stats.total')} value={events.length} color="blue" />
              <StatCard label={t('header.stats.upcoming')} value={kommende.length} color="green" />
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">{t('loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              <section>
                <SectionHeader title={t('sections.upcoming')} icon={<Calendar className="text-blue-500" />} />
                <div className="grid gap-4 mt-6">
                  {kommende.length === 0 ? (
                    <EmptyState message={t('emptyStates.noUpcoming')} />
                  ) : (
                    kommende.map(ev => <EventCard key={ev.id} ev={ev} vereinId={vereinId as string} />)
                  )}
                </div>
              </section>

              <section className="opacity-80 hover:opacity-100 transition-opacity">
                <SectionHeader title={t('sections.archive')} icon={<Trophy className="text-slate-500" />} />
                <div className="grid gap-4 mt-6">
                  {vergangene.length === 0 ? (
                    <EmptyState message={t('emptyStates.noArchive')} />
                  ) : (
                    vergangene.map(ev => <EventCard key={ev.id} ev={ev} vereinId={vereinId as string} isPast />)
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Hilfskomponenten ---

function SectionHeader({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      {icon}
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</h2>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: 'blue' | 'green' }) {
  return (
    <div className={`bg-[#1e293b] border-l-4 ${color === 'blue' ? 'border-blue-500' : 'border-emerald-500'} px-5 py-3 rounded-xl shadow-lg min-w-[140px]`}>
      <p className="text-[10px] uppercase font-black text-slate-500">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function EventCard({ ev, vereinId, isPast }: { ev: Event, vereinId: string, isPast?: boolean }) {
  const t = useTranslations("VereinsDashboard.eventCard");
  const router = useRouter();
  return (
    <div className="group bg-[#1e293b] hover:bg-[#26334d] border border-slate-800 rounded-2xl p-5 transition-all flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex gap-5 items-center w-full">
        <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center border ${isPast ? 'bg-slate-800 border-slate-700' : 'bg-blue-600/10 border-blue-500/30'}`}>
          <span className={`text-[10px] font-black uppercase ${isPast ? 'text-slate-500' : 'text-blue-400'}`}>
            {dayjs(ev.datumVon).format('MMM')}
          </span>
          <span className="text-xl font-black text-white">
            {dayjs(ev.datumVon).format('DD')}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
            {ev.name}
          </h3>
          <p className="text-sm text-slate-400 font-medium">
            {ev.location} {ev.land && `• ${ev.land}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={() => router.push(`/dashboard/verein/${vereinId}/publish/${ev.id}`)}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
        >
          <Trophy size={16} /> {t('results')}
        </button>
        <button
          onClick={() => router.push(`/dashboard/verein/${vereinId}/edit/${ev.id}`)}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
        >
          <Edit3 size={16} /> {t('edit')}
        </button>
        <ChevronRight className="hidden md:block text-slate-600 group-hover:text-white transition-all group-hover:translate-x-1" />
      </div>
    </div>
  );
}

function MenuLink({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-colors"
    >
      <span className="text-slate-500">{icon}</span>
      {label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl">
      <p className="text-slate-500 font-medium italic">{message}</p>
    </div>
  );
}