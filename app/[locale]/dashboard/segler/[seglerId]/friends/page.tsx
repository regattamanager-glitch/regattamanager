'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, UserPlus, Check, X, Anchor, Users, AlertCircle } from "lucide-react";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

type Friend = {
  id: string;
  vorname: string;
  nachname: string;
  nation?: string;
  profilbild?: string;
  type: string;
  status: 'accepted' | 'pending_incoming' | 'pending_outgoing' | 'none';
};

export default function FriendsPage() {
  const t = useTranslations("Friends");
  const params = useParams();
  const seglerId = params?.seglerId as string;
  const router = useRouter();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [allUsers, setAllUsers] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'my_crew'>('discover');

  async function loadData() {
    if (!seglerId || seglerId === "null") return; 
    
    try {
      setLoading(true);
      const [resAccounts, resInvites] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/notification')
      ]);

      if (!resAccounts.ok || !resInvites.ok) throw new Error("API Error");

      const accounts = await resAccounts.json();
      const allInvites = await resInvites.json();

      const myAccount = accounts.find((a: any) => String(a.id) === String(seglerId));
      const myFriendsIds = myAccount?.friends || [];

      const formattedUsers = accounts
        .filter((a: any) => String(a.id) !== String(seglerId) && a.type === "segler")
        .map((a: any) => {
          let status: 'accepted' | 'pending_incoming' | 'pending_outgoing' | 'none' = 'none';

          if (myFriendsIds.includes(a.id)) {
            status = 'accepted';
          } else {
            const invite = allInvites.find((inv: any) => 
              !inv.eventId && (
                (String(inv.senderId) === String(seglerId) && String(inv.receiverId) === String(a.id)) ||
                (String(inv.senderId) === String(a.id) && String(inv.receiverId) === String(seglerId))
              )
            );

            if (invite) {
              status = String(invite.senderId) === String(seglerId) ? 'pending_outgoing' : 'pending_incoming';
            }
          }
          return { ...a, status };
        });
      
      setAllUsers(formattedUsers);
      setFriends(formattedUsers.filter((u: Friend) => u.status !== 'none'));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (seglerId) loadData();
  }, [seglerId]);

  const handleInviteDecision = async (friendId: string, action: 'accept' | 'decline') => {
    try {
      const resInvites = await fetch('/api/notification');
      const allInvites = await resInvites.json();
      const invite = allInvites.find((inv: any) => 
        !inv.eventId && 
        String(inv.senderId) === String(friendId) && 
        String(inv.receiverId) === String(seglerId)
      );

      if (!invite) return;

      const res = await fetch('/api/notification/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: invite.id, action })
      });

      if (res.ok) await loadData();
    } catch (err) { console.error(err); }
  };

  const sendRequest = async (friendId: string) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: seglerId, receiverId: friendId })
      });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  };

  const incomingRequests = friends.filter(f => f.status === 'pending_incoming');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const incomingIds = incomingRequests.map(req => req.id);

  const filteredUsers = allUsers.filter((u: Friend) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = `${u.vorname} ${u.nachname} ${u.nation}`.toLowerCase().includes(q);
    const isNotIncoming = !incomingIds.includes(u.id);

    if (activeTab === 'my_crew') {
      return matchesSearch && (u.status === 'accepted' || u.status === 'pending_outgoing');
    }
    return matchesSearch && isNotIncoming;
  });

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black uppercase italic">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 pb-20 font-sans">
      <nav className="sticky top-0 z-50 bg-[#1e293b]/80 md:rounded-[2.5rem] backdrop-blur-xl border-b border-slate-700/50 text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-black hover:text-blue-400 uppercase italic">
            <ArrowLeft className="w-4 h-4" /> {t('navBack')}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <header className="mb-10">
          <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-8">
            {t('titleMain')} <span className="text-blue-600">{t('titleHighlight')}</span>
          </h1>

          <div className="flex gap-4 mb-8">
            <button onClick={() => setActiveTab('discover')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
              {t('tabDiscover')}
            </button>
            <button onClick={() => setActiveTab('my_crew')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my_crew' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
              {t('tabMyCrew')} ({acceptedFriends.length})
            </button>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              // Hier wird jetzt der dynamische Key aus der JSON verwendet
              placeholder={t('searchPlaceholder')} 
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-blue-500 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {incomingRequests.length > 0 && (
              <section className="bg-blue-600/10 border-2 border-blue-500/30 p-6 rounded-[2.5rem]">
                <h2 className="text-[11px] font-black uppercase text-blue-400 mb-6 tracking-[0.2em] flex items-center gap-3">
                  <AlertCircle className="w-4 h-4" /> {t('requestsHeader')} ({incomingRequests.length})
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {incomingRequests.map(req => (
                    <FriendCard 
                      key={req.id} 
                      person={req} 
                      seglerId={seglerId}
                      isRequest 
                      onAccept={() => handleInviteDecision(req.id, 'accept')} 
                      onDecline={() => handleInviteDecision(req.id, 'decline')}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map(user => (
                  <FriendCard 
                    key={user.id} 
                    person={user} 
                    seglerId={seglerId}
                    onSend={() => sendRequest(user.id)} 
                  />
                ))}
              </div>
            </section>
          </div>

          <aside>
            <div className="bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-700/50">
              <h3 className="text-white font-black uppercase italic text-lg mb-6">{t('sidebarTitle')}</h3>
              <StatRow label={t('statConnected')} value={acceptedFriends.length.toString()} />
              <StatRow label={t('statRequests')} value={incomingRequests.length.toString()} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function FriendCard({ person, seglerId, isRequest, onAccept, onDecline, onSend }: { person: Friend, seglerId: string, isRequest?: boolean, onAccept?: () => void, onDecline?: () => void, onSend?: () => void }) {
  const t = useTranslations("Friends");
  const isIncoming = isRequest || person.status === 'pending_incoming';

  return (
    <div className={`p-5 flex items-center gap-4 transition-all rounded-3xl border ${isIncoming ? 'bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-500/10' : 'bg-[#1e293b] border-slate-700/50 hover:border-slate-500/50'}`}>
      <Link href={`/dashboard/segler/${seglerId}/friends/profile/${person.id}`} className="flex items-center gap-4 flex-1 min-w-0 group">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black italic text-slate-500 border border-slate-700 shrink-0 overflow-hidden uppercase group-hover:border-blue-500 transition-colors">
          {person.profilbild ? <img src={person.profilbild} className="w-full h-full object-cover" alt="" /> : person.vorname[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-black uppercase italic truncate group-hover:text-blue-400">
            {person.vorname} {person.nachname}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {person.nation && <span className="text-[8px] font-bold text-blue-400 uppercase bg-blue-400/10 px-1.5 py-0.5 rounded">{person.nation}</span>}
          </div>
        </div>
      </Link>

      <div className="flex gap-2">
        {isIncoming ? (
          <>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAccept?.(); }} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-green-600 transition-all active:scale-95"><Check className="w-5 h-5" /></button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDecline?.(); }} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"><X className="w-5 h-5" /></button>
          </>
        ) : person.status === 'accepted' ? (
          <div className="text-blue-500 p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20"><Anchor className="w-5 h-5" /></div>
        ) : person.status === 'pending_outgoing' ? (
          <div className="bg-yellow-500/10 text-yellow-500 px-3 py-2 rounded-xl text-[8px] font-black uppercase italic border border-yellow-500/20 animate-pulse">{t('statusWaiting')}</div>
        ) : (
          <button onClick={(e) => { e.preventDefault(); onSend?.(); }} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"><UserPlus className="w-5 h-5" /></button>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] font-black uppercase mb-4 text-white">
      <span className="text-slate-500 tracking-widest">{label}</span>
      <span className="text-white italic">{value}</span>
    </div>
  );
}