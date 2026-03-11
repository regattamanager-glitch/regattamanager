'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Save, Globe, Instagram, 
  Camera, MapPin, Mail, CreditCard 
} from "lucide-react";
import { useRouter } from "@/navigation";
import { useTranslations } from 'next-intl';

type Verein = {
  id: string;
  name: string;
  kuerzel?: string;
  adresse?: string;
  email: string;
  stripeAccountId?: string;
  profilbild?: string;
  instagram?: string;
  tiktok?: string;
};

interface InputGroupProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
} 

export default function VereinsProfilPage() {
  // Namespace auf ProfileSettings geändert
  const t = useTranslations('ProfileSettings');
  const { vereinId } = useParams<{ vereinId: string }>();
  const router = useRouter();

  const [verein, setVerein] = useState<Verein | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [stripeId, setStripeId] = useState("");
  const [stripeError, setStripeError] = useState("");

  useEffect(() => {
    async function loadProfile() {
  setLoading(true);
  try {
    const res = await fetch(`/api/accounts?id=${vereinId}`);
    if (!res.ok) throw new Error("Fehler beim Abrufen der Profildaten");
    
    const data = await res.json();
    
    // Wir setzen das gesamte Verein-Objekt
    setVerein(data);
    
    // WICHTIG: Hier auf das große 'A' achten, da deine DB-Spalte stripeAccountId heißt
    if (data.stripeAccountId) {
      setStripeId(data.stripeAccountId);
    } else {
      setStripeId(""); // Zurücksetzen, falls keine ID vorhanden
    }
  } catch (err) {
    console.error("Fehler beim Laden des Vereins-Profils:", err);
  } finally {
    setLoading(false);
  }
}
    if (vereinId) loadProfile();
  }, [vereinId]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setVerein(prev => prev ? { ...prev, profilbild: reader.result as string } : null);
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setVerein(prev => prev ? { ...prev, profilbild: reader.result as string } : null);
    reader.readAsDataURL(file);
  };

  async function saveProfile() {
    if (!verein || !currentPassword) {
      alert(t('confirmPasswordAlert'));
      return;
    }
    setSaving(true);
    if (stripeId && !stripeId.startsWith("acct_")) {
      setStripeError(t('stripeError'));
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/accounts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verein.email,
          currentPassword,
          update: { ...verein, stripeAccountId: stripeId },
        }),
      });

      if (!res.ok) throw new Error("Save error");
      setCurrentPassword("");
        router.push(`/dashboard/verein/${vereinId}`);
    } catch (err) {
      alert(t('errorAlert'));
    } finally {
      setSaving(false);
    }
  }

  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

async function handleStripeConnect() {
  setIsConnectingStripe(true);
  setStripeError("");

  try {
    const res = await fetch("/api/stripe/connect/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vereinId: vereinId }), // vereinId kommt aus useParams
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Verbindung zu Stripe fehlgeschlagen");
    }

    // Wenn Stripe uns die URL schickt, leiten wir den User direkt weiter
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (err: any) {
    console.error("Stripe Onboarding Error:", err);
    setStripeError(err.message);
  } finally {
    setIsConnectingStripe(false);
  }
}

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white italic">
      {t('loading')}
    </div>
  );
  
  if (!verein) return <div className="p-10 text-white">{t('notFound')}</div>;

  return (
    <div className="min-h-screen bg-[#0a192f]/90 rounded-2xl text-slate-200 pb-20">
      <nav className="sticky top-0 z-50 bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-black hover:text-blue-400 transition-colors uppercase italic">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            {t('accountBadge')}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">
            Profil <span className="text-blue-600">bearbeiten</span>
          </h1>
          <p className="text-slate-400 uppercase text-xs tracking-widest font-bold">
            {t('subtitle')}
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Linke Spalte */}
          <div className="space-y-6">
            <div 
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative group aspect-square rounded-[2.5rem] overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 hover:border-blue-500 transition-all flex items-center justify-center"
            >
              {verein.profilbild ? (
                <img src={verein.profilbild} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-500">{t('dropImage')}</p>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                <span className="text-xs font-black uppercase text-white">{t('changeImage')}</span>
              </label>
            </div>

            <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">{t('systemInfo')}</p>
               <div className="space-y-3">
                 <div className="flex justify-between text-xs">
                   <span className="text-slate-400">ID:</span>
                   <span className="font-mono text-blue-400">{verein.id.slice(0,8)}...</span>
                 </div>
                 <div className="flex justify-between text-xs">
                   <span className="text-slate-400">{t('status')}:</span>
                   <span className="text-green-500 font-bold uppercase italic">{t('verified')}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-black uppercase italic text-white">{t('basicInfo')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label={t('labelName')} value={verein.name} 
                  onChange={(v) => setVerein({...verein, name: v})} />
                <InputGroup label={t('labelKuerzel')} value={verein.kuerzel || ""} 
                  onChange={(v) => setVerein({...verein, kuerzel: v})} />
                <div className="md:col-span-2">
                  <InputGroup label={t('labelAddress')} icon={<MapPin className="w-4 h-4"/>} value={verein.adresse || ""} 
                    onChange={(v) => setVerein({...verein, adresse: v})} />
                </div>
                <InputGroup label={t('labelEmail')} icon={<Mail className="w-4 h-4"/>} value={verein.email} disabled />
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase italic text-white">{t('payments')}</h2>
                </div>
              
                <div className="space-y-4">
                  <InputGroup 
                    label="Stripe Account ID" 
                    value={stripeId} 
                    placeholder={t('stripePlaceholder')}
                    onChange={(v) => {setStripeId(v); setStripeError("");}} 
                  />
                  
                  {stripeError ? (
                    <p className="text-red-500 text-[10px] font-bold uppercase px-1">
                      {stripeError}
                    </p>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleStripeConnect}
                        disabled={isConnectingStripe}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 hover:text-white transition-all shadow-sm disabled:opacity-50"
                      >
                        {isConnectingStripe 
                          ? (t('loading') || 'Wird geladen...') 
                          : (t('createStripeAccount') || 'Account erstellen')}
                      </button>
                    </div>
                  )}
                </div>
              </section>
              <section className="bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-700/50">
                <h3 className="text-sm font-black uppercase text-pink-500 mb-6 flex items-center gap-2">
                  <Instagram className="w-4 h-4" /> {t('socialMedia')}
                </h3>
                <div className="space-y-4">
                  <InputGroup label="Instagram" value={verein.instagram || ""} 
                    onChange={(v) => setVerein({...verein, instagram: v})} />
                  <InputGroup label="TikTok" value={verein.tiktok || ""} 
                    onChange={(v) => setVerein({...verein, tiktok: v})} />
                </div>
              </section>
            </div>

            <section className="bg-blue-600 rounded-[2.5rem] p-8 border border-blue-400/30 shadow-2xl shadow-blue-600/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black uppercase text-blue-100 mb-2 ml-1">{t('confirmRequired')}</label>
                  <input 
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    className="w-full bg-blue-700/50 border border-blue-400/30 rounded-2xl px-4 py-3 text-white placeholder:text-blue-300 outline-none focus:ring-2 ring-white/20 transition-all"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full md:w-auto px-10 py-4 bg-white text-blue-600 rounded-2xl font-black uppercase italic hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? t('saving') : <><Save className="w-5 h-5"/> {t('saveBtn')}</>}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputGroup({ label, value, onChange, disabled, placeholder, icon }: InputGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-tighter flex items-center gap-1">
        {icon} {label}
      </label>
      <input
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-medium ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}