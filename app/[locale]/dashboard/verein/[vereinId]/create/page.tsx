'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from 'next-intl';

const BOOTSKLASSEN = [
  "ILCA","ILCA 4","ILCA 6","ILCA 7","Optimist","420","470","49er","49erFX",
  "Finn","Europe","RS:X","iQFoil","Nacra 17","Nacra 15","Vaurien","FJ","Fireball","505",
  "Hobie Cat 16","RS Aero","OK Dinghy","Topper","Dragon","Star","Soling",
  "Flying Dutchman","Tornado","J70","J80","Snipe","RS200","RS400","RS500",
  "RS700","RS800","RS100","Moth","Formula 18","A-Cat","Elliott 6m","O-Jolle","Firefly",
  "Sharpie","Swallow","Tempest","Laser II","International 14","RS Feva","RS Vision",
  "Yngling","5,5m-R-Klasse","6m-R-Klasse","J24","8m-R-Klasse","Contender","Splash","Zoom8",
  "Sunfish","B14","Musto Skiff","RS Tera","O’pen BIC","Sonstige"
];



type Account = {
  id: number;
  name: string;
  kuerzel?: string;
  adresse?: string;
  email: string; 
  stripeAccountId?: string;
};

type Extra = {
  name: string;
  price: string;
};

type DocumentItem = {
  name: string;
  file: File;
};

type ClassConfig = {
  id: string;
  name: string;
  gender: "Offen" | "Damen" | "Herren" | "Mixed";
  minAge: string;
  maxAge: string;
  maxParticipants: string;
  feeRegular: string;
  feeLate: string;
};

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

export default function CreateEventPage() {
  const t = useTranslations('CreateEvent');
  const dropRef = useRef<HTMLDivElement>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [alleBootsklassen, setAlleBootsklassen] = useState(false);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [ibanPopupOpen, setIbanPopupOpen] = useState(false);
  const [iban1, setIban1] = useState("");
  const [iban2, setIban2] = useState("");
  const [ibanError, setIbanError] = useState("");

  const [form, setForm] = useState({
    name: "",
    datumVon: "",
    datumBis: "",
    anmeldungVon: "",
    anmeldungBis: "",
    land: "",
    location: "",
    privat: false,
    notiz: "",
    extras: [] as Extra[],
    documents: [] as DocumentItem[],
    currentPassword: ""
  });

  const [activeClasses, setActiveClasses] = useState<ClassConfig[]>([]);

  const addClass = (name: string = "") => {
    const newClass: ClassConfig = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      gender: "Offen",
      minAge: "",
      maxAge: "",
      maxParticipants: "",
      feeRegular: "30",
      feeLate: "40",
    };
    setActiveClasses([...activeClasses, newClass]);
  };

  const updateClass = (id: string, field: keyof ClassConfig, value: string) => {
    setActiveClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeClass = (id: string) => setActiveClasses(prev => prev.filter(c => c.id !== id));

  const [stripeId, setStripeId] = useState(""); 
  const [stripeError, setStripeError] = useState(""); 
  const [stripePopupOpen, setStripePopupOpen] = useState(false); 

  useEffect(() => {
    const syncSession = async () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const acc = JSON.parse(stored);
          setAccount(acc);
          if (acc.adresse) setForm(f => ({ ...f, location: acc.adresse }));
        } catch (e) {
          console.error("Fehler beim Parsen der lokalen Daten", e);
        }
      }

      try {
        const res = await fetch("/api/accounts/session");
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data; 
          if (user && user.email) {
            setAccount(user);
            localStorage.setItem("user", JSON.stringify(user));
            if (user.adresse) setForm(f => ({ ...f, location: user.adresse }));
          }
        }
      } catch (err) {
        console.error("API Abfrage fehlgeschlagen", err);
      } finally {
        setIsReady(true);
      }
    };
    syncSession();
  }, []);

  const saveStripeAccountId = async (): Promise<boolean> => {
    if (!account) return false;
    if (!stripeId.startsWith("acct_")) {
      setStripeError(t("invalidStripe"));
      return false;
    }
    try {
      const res = await fetch("/api/accounts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          currentPassword: form.currentPassword,
          update: { stripeAccountId: stripeId }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || t("saveStripeError"));
      setAccount(a => a ? { ...a, stripeAccountId: stripeId } : null);
      setStripePopupOpen(false);
      return true;
    } catch (err) {
      console.error(err);
      setStripeError(t("saveStripeError"));
      return false;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setForm(f => ({
      ...f,
      documents: [...f.documents, ...files.map(file => ({ name: file.name, file }))]
    }));
  };

  const addExtra = () => setForm(f => ({ ...f, extras: [...f.extras, { name: "", price: "" }] }));
  const updateExtra = (i: number, field: keyof Extra, value: string) => {
    setForm(f => {
      const newExtras = [...f.extras];
      newExtras[i][field] = value;
      return { ...f, extras: newExtras };
    });
  };
  const removeExtra = (i: number) => setForm(f => ({ ...f, extras: f.extras.filter((_, idx) => idx !== i) }));

  const submitFormData = async () => {
    if (!account) return;
    const gebuehrenProKlasse: Record<string, any> = {};
    const bootsklassenNamen: string[] = [];
    activeClasses.forEach(cls => {
      const className = cls.name || t("unnamedClass");
      bootsklassenNamen.push(className);
      gebuehrenProKlasse[className] = {
        normal: Number(cls.feeRegular),
        spaet: Number(cls.feeLate),
        gender: cls.gender,
        minAge: cls.minAge ? Number(cls.minAge) : null,
        maxAge: cls.maxAge ? Number(cls.maxAge) : null,
        limit: cls.maxParticipants ? Number(cls.maxParticipants) : null
      };
    });
    const payload = {
      name: form.name,
      datumVon: form.datumVon,
      datumBis: form.datumBis,
      land: form.land,
      location: form.location,
      privat: form.privat,
      notiz: form.notiz,
      vereinId: account.id,
      bootsklassen: bootsklassenNamen,
      gebuehrenProKlasse,
      anmeldungsZeitraum: {
        von: form.anmeldungVon,
        bis: form.anmeldungBis
      },
      extras: form.extras,
      documents: form.documents 
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push(`/dashboard/verein/${account.id}`);
      } else {
        const data = await res.json();
        alert(data.message || t("eventCreateError"));
      }
    } catch (err) {
      console.error(err);
      alert(t("eventCreateError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeClasses.length === 0) {
      alert(t("addAtLeastOneClass"));
      return;
    }
    const invalidFees = activeClasses.some(cls => Number(cls.feeLate) < Number(cls.feeRegular) * 1.08);
    if (invalidFees) alert(t("lateFeeWarning"));
    if (!account?.stripeAccountId) {
      setIbanPopupOpen(true);
      return;
    }
    await submitFormData();
  };

  if (!isReady) return <div className="min-h-screen bg-[#0a192f] flex items-center justify-center text-white">{t("loading")}</div>;
  if (!account) return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white gap-4">
      <p className="text-xl font-bold">{t("accountNotLoaded")}</p>
      <p className="text-gray-400 text-sm max-w-md text-center">{t("accountNotLoadedDesc")}</p>
      <button onClick={() => router.push('/login')} className="bg-blue-600 px-6 py-2 rounded-xl font-bold">{t("login")}</button>
    </div>
  );

  const inputStyle = "input bg-gray-700 text-white placeholder-gray-400 border border-gray-600 px-3 py-2 rounded w-full focus:outline-none focus:border-blue-400";

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto bg-[#0a192f]/90 rounded-2xl p-6 space-y-6">
        <div className="max-w-4xl mx-auto p-6">
          <button type="button" onClick={() => router.back()} className="mb-6 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">← {t("back")}</button>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t("newEvent")}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIS */}
          <div className="space-y-4">
            <label className="text-white font-bold">{t("eventName")} *</label>
            <input className={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-bold">{t("startDate")} *</label>
              <input type="date" className={inputStyle} value={form.datumVon} onChange={e => setForm({ ...form, datumVon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white font-bold">{t("endDate")} *</label>
              <input type="date" className={inputStyle} value={form.datumBis} onChange={e => setForm({ ...form, datumBis: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-bold">{t("country")} *</label>
              <input className={inputStyle} value={form.land} onChange={e => setForm({ ...form, land: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white font-bold">{t("location")} *</label>
              <input className={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-bold">{t("registrationFrom")} *</label>
              <input type="date" className={inputStyle} value={form.anmeldungVon} onChange={e => setForm({ ...form, anmeldungVon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white font-bold">{t("registrationUntil")} *</label>
              <input type="date" className={inputStyle} value={form.anmeldungBis} onChange={e => setForm({ ...form, anmeldungBis: e.target.value })} />
            </div>
          </div>

          {/* Privat / Öffentlich */}
          <div className="flex items-center justify-between bg-gray-800 p-4 rounded">
            <div>
              <p className="text-white font-semibold">{t("privateEvent")}</p>
              <p className="text-gray-400 text-sm">{t("privateEventDesc")}</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, privat: !f.privat }))} className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${form.privat ? "bg-blue-600" : "bg-gray-600"}`}>
              <span className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform ${form.privat ? "translate-x-6" : ""}`} />
            </button>
          </div>
          
          {/* Notizen */}
          <div className="space-y-2 mt-2">
            <label className="text-white font-bold">{t('notes')}</label>
            <input
              className={inputStyle}
              value={form.notiz}
              onChange={e => setForm({ ...form, notiz: e.target.value })}
              placeholder={t('notesPlaceholder')}
            />
          </div>
          
          {/* NEUES KLASSEN-MANAGEMENT */}
          <div className="space-y-4 bg-gray-800/50 p-6 rounded-2xl border border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white italic">{t('classesAndDisciplines')}</h2>
                <p className="text-xs text-white/40">{t('classesDescription')}</p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                 <select 
                  className="flex-1 bg-gray-700 text-sm border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                  onChange={(e) => {
                      if(e.target.value) addClass(e.target.value);
                      e.target.value = "";
                  }}
                 >
                   <option value="">{t('chooseTemplate')}</option>
                   {BOOTSKLASSEN.map(b => <option key={b} value={b}>{t(`bootClasses.${b}`) ?? b}</option>)}
                 </select>
                 <button 
                  type="button"
                  onClick={() => addClass()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                 >
                   {t('customClass')}
                 </button>
              </div>
            </div>
          
            <div className="space-y-4">
              {activeClasses.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl text-white/20 italic">
                  {t('noClassesAdded')}
                </div>
              )}
          
              {activeClasses.map((cls) => (
                <div key={cls.id} className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl relative group animate-in fade-in zoom-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          
                    {/* Name & Geschlecht */}
                    <div className="md:col-span-4 space-y-3">
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-blue-400 ml-1">{t('className')}</label>
                          <input 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={cls.name}
                            onChange={(e) => updateClass(cls.id, "name", e.target.value)}
                            placeholder={t('exampleClass')}
                          />
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">{t('scoringGroup')}</label>
                          <select 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                            value={cls.gender}
                            onChange={(e) => updateClass(cls.id, "gender", e.target.value as any)}
                          >
                            <option value="Offen">{t('open')}</option>
                            <option value="Damen">{t('women')}</option>
                            <option value="Herren">{t('men')}</option>
                            <option value="Mixed">{t('mixed')}</option>
                          </select>
                      </div>
                    </div>
          
                    {/* Alter & Teilnehmer */}
                    <div className="md:col-span-3 space-y-3">
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">{t('ageMinMax')}</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" placeholder="0"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white text-center font-mono"
                              value={cls.minAge}
                              onChange={(e) => updateClass(cls.id, "minAge", e.target.value)}
                            />
                            <span className="text-white/20">-</span>
                            <input 
                              type="number" placeholder="99"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white text-center font-mono"
                              value={cls.maxAge}
                              onChange={(e) => updateClass(cls.id, "maxAge", e.target.value)}
                            />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">{t('participantLimit')}</label>
                          <input 
                            type="number" placeholder={t('unlimited')}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                            value={cls.maxParticipants}
                            onChange={(e) => updateClass(cls.id, "maxParticipants", e.target.value)}
                          />
                      </div>
                    </div>
          
                    {/* Gebühren */}
                    <div className="md:col-span-4 space-y-3">
                      <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">{t('entryFees')}</label>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <span className="text-[9px] text-green-500/70 block ml-1">{t('regular')}</span>
                              <input 
                                  type="number"
                                  className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2 text-green-400 font-mono font-bold focus:border-green-500 outline-none"
                                  value={cls.feeRegular}
                                  onChange={(e) => updateClass(cls.id, "feeRegular", e.target.value)}
                              />
                          </div>
                          <div className="space-y-1">
                              <span className="text-[9px] text-red-500/70 block ml-1">{t('lateFee')}</span>
                              <input 
                                  type="number"
                                  className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 font-mono font-bold focus:border-red-500 outline-none"
                                  value={cls.feeLate}
                                  onChange={(e) => updateClass(cls.id, "feeLate", e.target.value)}
                              />
                          </div>
                      </div>
                    </div>
          
                    {/* Löschen */}
                    <div className="md:col-span-1 flex justify-end">
                      <button 
                        type="button"
                        onClick={() => removeClass(cls.id)}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 p-3 rounded-xl transition-all active:scale-90"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* EXTRAS */}
          <div className="space-y-2">
            <p className="text-white font-bold mb-2">{t('extras')}</p>
            {form.extras.map((ex, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input className={inputStyle} placeholder={t('name')} value={ex.name} onChange={e => updateExtra(i, "name", e.target.value)} />
                <input type="number" className={inputStyle} placeholder={t('priceEuro')} value={ex.price} onChange={e => updateExtra(i, "price", e.target.value)} />
                <button type="button" className="text-red-400" onClick={() => removeExtra(i)}>{t('remove')}</button>
              </div>
            ))}
            <button type="button" className="text-blue-400" onClick={addExtra}>+ {t('addExtra')}</button>
          </div>
          
          {/* DOKUMENTE */}
          <div
            ref={dropRef}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-600 p-4 rounded text-gray-300 text-center"
          >
            {t('dragDocumentsHere')}
          </div>
          <ul className="mt-2 text-gray-200">
            {form.documents.map((doc, i) => <li key={i}>{doc.name}</li>)}
          </ul>
          
          {ibanPopupOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-2xl w-96 space-y-4">
                <h2 className="text-white text-xl font-bold">{t('enterIban')}</h2>
                <input type="text" placeholder={t('iban')} className={inputStyle} value={iban1} onChange={e => setIban1(e.target.value.toUpperCase())} />
                <input type="text" placeholder={t('repeatIban')} className={inputStyle} value={iban2} onChange={e => setIban2(e.target.value.toUpperCase())} />
                {ibanError && <p className="text-red-400">{ibanError}</p>}
                <div className="flex justify-end space-x-2">
                  <button type="button" className="bg-gray-700 px-4 py-2 rounded text-white" onClick={() => setIbanPopupOpen(false)}>{t('cancel')}</button>
                  <button type="button" className="bg-blue-600 px-4 py-2 rounded text-white" onClick={async () => { const success = await saveStripeAccountId(); if (success) await submitFormData(); }}>{t('saveAndContinue')}</button>
                </div>
              </div>
            </div>
          )}
          
          {/* SUBMIT */}
          <button className="w-full bg-blue-700 py-2 rounded text-white font-bold">{t('createRegatta')}</button>
       </form>
      </div>
    </div>
  );
}
