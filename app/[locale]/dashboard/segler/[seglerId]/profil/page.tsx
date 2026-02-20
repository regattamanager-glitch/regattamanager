'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Save, 
  User, 
  Share2, 
  Lock, 
  Instagram, 
  Music2, 
  Fingerprint
} from "lucide-react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

type Segler = {
  id: string;
  vorname: string;
  nachname: string;
  nation: string;
  email: string;
  geburtsjahr?: string;
  worldSailingId?: string;
  instagram?: string;
  tiktok?: string;
  profilbild?: string;
};

export default function SeglerProfilPage() {
  const t = useTranslations("EditProfile");
  const params = useParams(); 
  const seglerId = params?.seglerId as string;
  const router = useRouter();

  const [segler, setSegler] = useState<Segler | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!seglerId || seglerId === "undefined") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/accounts?id=${seglerId}`);
        if (!res.ok) throw new Error("API Fehler");
        const data = await res.json();
        setSegler(data);
      } catch (e) {
        console.error("Ladefehler:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [seglerId]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSegler(prev => prev ? { ...prev, profilbild: reader.result as string } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [segler]);

  async function saveProfile() {
    if (!segler || !currentPassword) {
      alert(t('alertFillPassword'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: segler.email,
          currentPassword,
          update: { ...segler },
        }),
      });
      if (res.ok) {
        alert(t('alertSuccess'));
        setCurrentPassword("");
        router.push(`/dashboard/segler/${seglerId}`);
      } else {
        alert(t('alertError'));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#010b1a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!segler) return (
    <div className="min-h-screen bg-[#010b1a] flex flex-col items-center justify-center text-white p-6">
      <p className="text-xl mb-4 text-gray-400">{t('notFound')}</p>
      <button onClick={() => router.back()} className="text-blue-400 flex items-center gap-2">
        <ArrowLeft size={20} /> {t('back')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#010b1a]/90 rounded-[2.5rem] bg-gradient-to-b from-[#011638] to-[#010b1a] text-white pb-20 font-sans">
      
      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto p-6 flex justify-between items-center">
        <button
          onClick={() => router.push(`/dashboard/segler/${seglerId}`)}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 text-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          {t('navDashboard')}
        </button>
        <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">{t('navTitle')}</div>
      </div>

      <div className="max-w-3xl mx-auto px-6 space-y-8">
        
        {/* Header & Profilbild */}
        <div className="relative flex flex-col items-center py-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="group relative w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-[#011638] flex items-center justify-center relative">
              {segler.profilbild ? (
                <img src={segler.profilbild} alt="" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
              ) : (
                <User size={50} className="text-gray-500" />
              )}
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                <Camera size={24} className="mb-1 text-white" />
                <span className="text-[10px] font-bold uppercase">{t('imgChange')}</span>
                <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight">{segler.vorname} {segler.nachname}</h1>
          <div className="flex items-center gap-2 mt-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
            {segler.nation}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section: Personal Info */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex items-center gap-3 text-blue-400 mb-2 font-black uppercase text-[11px] tracking-widest">
              <User size={16} /> {t('sectionPersonal')}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 ml-1 uppercase font-bold">{t('labelFirstName')}</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition"
                  value={segler.vorname}
                  onChange={(e) => setSegler({ ...segler, vorname: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 ml-1 uppercase font-bold">{t('labelLastName')}</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition"
                  value={segler.nachname}
                  onChange={(e) => setSegler({ ...segler, nachname: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 ml-1 uppercase font-bold text-blue-400/60">{t('labelEmail')}</label>
                <div className="flex items-center gap-3 w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-gray-500 italic">
                  {segler.email}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Professional & Social */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex items-center gap-3 text-cyan-400 mb-2 font-black uppercase text-[11px] tracking-widest">
              <Share2 size={16} /> {t('sectionSocial')}
            </div>
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] text-gray-500 ml-1 uppercase font-bold">{t('labelWorldSailing')}</label>
                <div className="relative mt-1">
                  <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition"
                    value={segler.worldSailingId || ""}
                    placeholder={t('placeholderWorldSailing')}
                    onChange={(e) => setSegler({ ...segler, worldSailingId: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] text-gray-500 ml-1 uppercase font-bold">{t('labelInstagram')}</label>
                <div className="relative mt-1">
                  <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-pink-500/50 outline-none transition"
                    value={segler.instagram || ""}
                    placeholder="@username"
                    onChange={(e) => setSegler({ ...segler, instagram: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] text-gray-500 ml-1 uppercase font-bold">{t('labelTikTok')}</label>
                <div className="relative mt-1">
                  <Music2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
                    value={segler.tiktok || ""}
                    placeholder="@username"
                    onChange={(e) => setSegler({ ...segler, tiktok: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="bg-gradient-to-r from-blue-600/20 to-transparent p-10 rounded-[3rem] border border-blue-500/30 backdrop-blur-md shadow-inner">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full space-y-2">
              <label className="flex items-center gap-2 text-[10px] text-blue-300 ml-1 uppercase font-black tracking-widest">
                <Lock size={12} /> {t('labelConfirm')}
              </label>
              <input
                type="password"
                placeholder={t('placeholderPassword')}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-700"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-green-600 disabled:bg-gray-800 text-white font-black px-12 py-5 rounded-[1.5rem] transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:cursor-not-allowed group"
            >
              {saving ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={20} className="group-hover:rotate-12 transition-transform" /> 
                  {t('btnSave')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Meta Info Footer */}
        <div className="text-center space-y-1">
           <div className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">
             {t('footerRecord')}
           </div>
           <div className="text-[9px] text-gray-700 font-mono">
             UID: {segler.id} • STATUS: {t('footerStatus')}
           </div>
        </div>
      </div>
    </div>
  );
}