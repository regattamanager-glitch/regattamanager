'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { useTranslations } from 'next-intl';

/* ============================== KONSTANTEN ============================== */

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

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

/* ============================== COMPONENT ============================== */

export default function EditEventPage() {
  const t = useTranslations('CreateEvent');
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const vereinId = params.vereinId as string; 

  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dropRef = useRef<HTMLDivElement>(null);

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
    extras: [] as { name: string; price: string }[],
    documents: [] as { name: string; url: string; id?: string }[],
  });

  const [activeClasses, setActiveClasses] = useState<any[]>([]);

  /* ============================== LOAD DATA ============================== */

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setAccount(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId || !account) return;
      try {
        const res = await fetch(`/api/events?vereinId=${account.id}`);
        const data = await res.json();
        const event = data.find((e: any) => e.id === eventId);

        if (!event) return;

        setForm({
          name: event.name || "",
          datumVon: event.datumVon || "",
          datumBis: event.datumBis || "",
          anmeldungVon: event.anmeldungsZeitraum?.von || "",
          anmeldungBis: event.anmeldungsZeitraum?.bis || "",
          land: event.land || "",
          location: event.location || "",
          privat: event.privat || false,
          notiz: event.notiz || "",
          extras: event.extras?.map((ex: any) => ({ name: ex.name, price: String(ex.price) })) || [],
          documents: event.documents || [],
        });

        if (event.gebuehrenProKlasse) {
          const configs = Object.entries(event.gebuehrenProKlasse).map(([name, val]: [string, any]) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            gender: val.gender || "Offen",
            minAge: val.minAge || "",
            maxAge: val.maxAge || "",
            maxParticipants: val.limit || "",
            feeRegular: val.normal || "",
            feeLate: val.spaet || "",
          }));
          setActiveClasses(configs);
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId, account]);

  /* ============================== ACTIONS ============================== */

  const addClass = (name = "") => {
    setActiveClasses([...activeClasses, {
      id: Math.random().toString(36).substr(2, 9),
      name, gender: "Offen", minAge: "", maxAge: "", maxParticipants: "", feeRegular: "30", feeLate: "40"
    }]);
  };

  const updateClass = (id: string, field: string, value: any) => {
    setActiveClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeClass = (id: string) => setActiveClasses(activeClasses.filter(c => c.id !== id));
  const addExtra = () => setForm({ ...form, extras: [...form.extras, { name: "", price: "" }] });
  
  const updateExtra = (i: number, field: string, val: string) => {
    const next = [...form.extras];
    (next[i] as any)[field] = val;
    setForm({ ...form, extras: next });
  };
  
  const removeExtra = (i: number) => setForm({ ...form, extras: form.extras.filter((_, idx) => idx !== i) });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newDocs = files.map(f => ({ name: f.name, url: "#" }));
    setForm({ ...form, documents: [...form.documents, ...newDocs] });
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;
    await fetch(`/api/events?id=${eventId}`, { method: "DELETE" });
    router.push(`/dashboard/verein/${vereinId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 8% Regel Validierung (Regatta Manager Richtlinie)
    const invalidFees = activeClasses.some(cls => Number(cls.feeLate) < Number(cls.feeRegular) * 1.08);
    if (invalidFees) {
      alert(t("lateFeeWarning"));
      return;
    }

    const gebuehrenProKlasse: any = {};
    activeClasses.forEach(c => {
      gebuehrenProKlasse[c.name] = { 
        normal: Number(c.feeRegular), 
        spaet: Number(c.feeLate), 
        gender: c.gender, 
        minAge: c.minAge ? Number(c.minAge) : null, 
        maxAge: c.maxAge ? Number(c.maxAge) : null, 
        limit: c.maxParticipants ? Number(c.maxParticipants) : null 
      };
    });

    const payload = { 
      ...form, 
      id: eventId, 
      gebuehrenProKlasse, 
      bootsklassen: activeClasses.map(c => c.name),
      extras: form.extras.map(ex => ({ name: ex.name, price: Number(ex.price) })),
      anmeldungsZeitraum: { von: form.anmeldungVon, bis: form.anmeldungBis }
    };

    try {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push(`/dashboard/verein/${vereinId}`);
      } else {
        alert(t("saveError"));
      }
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };

  /* ============================== RENDER ============================== */

  if (!account && !loading) return <p className="p-6 text-white">{t("pleaseLogin")}</p>;
  if (loading) return <p className="p-6 text-white text-center mt-10 italic">{t("loadingData")}</p>;

  const inputStyle = "input bg-gray-700 text-white placeholder-gray-400 border border-gray-600 px-3 py-2 rounded w-full focus:outline-none focus:border-blue-400";

  return (
      <div className="max-w-5xl mx-auto bg-[#0a192f]/90 p-6 rounded-2xl space-y-6 border border-gray-800">
        
        <div className="flex justify-between items-center">
          <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-800 transition">
            ← {t("back")}
          </button>
          <button type="button" onClick={handleDelete} className="text-red-500 text-sm border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition">
            {t("deleteEvent")}
          </button>
        </div>

        <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {t("editRegattaTitle")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BASIS DATEN */}
          <div className="space-y-4">
            <label className="text-white font-bold block">{t("eventNameLabel")} *</label>
            <input className={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-bold block">{t("startDateLabel")} *</label>
              <input type="date" className={inputStyle} value={form.datumVon} onChange={e => setForm({ ...form, datumVon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white font-bold block">{t("endDateLabel")} *</label>
              <input type="date" className={inputStyle} value={form.datumBis} onChange={e => setForm({ ...form, datumBis: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-bold block">{t("countryLabel")} *</label>
              <input className={inputStyle} value={form.land} onChange={e => setForm({ ...form, land: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white font-bold block">{t("locationLabel")} *</label>
              <input className={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-800 pb-6">
            <div className="space-y-2">
              <label className="text-white font-bold block">{t("regStartLabel")} *</label>
              <input type="date" className={inputStyle} value={form.anmeldungVon} onChange={e => setForm({ ...form, anmeldungVon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white font-bold block">{t("regEndLabel")} *</label>
              <input type="date" className={inputStyle} value={form.anmeldungBis} onChange={e => setForm({ ...form, anmeldungBis: e.target.value })} />
            </div>
          </div>

          {/* Privat Toggle */}
          <div className="flex items-center justify-between bg-gray-800 p-5 rounded-xl border border-white/5 shadow-inner">
            <div>
              <p className="text-white font-semibold">{t("privateEventTitle")}</p>
              <p className="text-gray-400 text-xs">{t("privateEventSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, privat: !f.privat }))}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${form.privat ? "bg-blue-600" : "bg-gray-600"}`}
            >
              <span className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-300 ${form.privat ? "translate-x-6" : ""}`} />
            </button>
          </div>

          {/* Notizen */}
          <div className="space-y-2">
            <label className="text-white font-bold block">{t("notesLabel")}</label>
            <textarea 
               className={`${inputStyle} h-20 resize-none`} 
               value={form.notiz} 
               onChange={e => setForm({ ...form, notiz: e.target.value })} 
            />
          </div>

          {/* KLASSEN MANAGEMENT */}
          <div className="space-y-4 bg-gray-800/50 p-6 rounded-2xl border border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white italic">{t("classesTitle")}</h2>
                <p className="text-xs text-white/40">{t("classesSubtitle")}</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select className="flex-1 bg-gray-700 text-sm border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" 
                  onChange={(e) => { if(e.target.value) addClass(e.target.value); e.target.value = ""; }}>
                  <option value="">{t("templateSelect")}</option>
                  {BOOTSKLASSEN.map(b => {
                    const key = b.replace(/\s+/g, '');
                    const translationPath = `bootClasses.${key}`;
                  
                    // Prüfen, ob der Key existiert, sonst Fallback auf Originalnamen
                    const label = t.has?.(translationPath) ? t(translationPath) : b;
                  
                    return (
                      <option key={b} value={b}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <button type="button" onClick={() => addClass()} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2 rounded-xl transition">
                  {t("customClassBtn")}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeClasses.map((cls) => (
                <div key={cls.id} className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 relative group transition-all hover:border-blue-500/30">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-4 space-y-3">
                      <label className="text-[10px] uppercase font-black text-blue-400 block ml-1 tracking-widest">{t("classNameLabel")}</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-semibold" value={cls.name} onChange={(e) => updateClass(cls.id, "name", e.target.value)} />
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" value={cls.gender} onChange={(e) => updateClass(cls.id, "gender", e.target.value)}>
                        <option value="Offen">{t("genderOpen")}</option>
                        <option value="Damen">{t("genderFemale")}</option>
                        <option value="Herren">{t("genderMale")}</option>
                        <option value="Mixed">{t("genderMixed")}</option>
                      </select>
                    </div>
                    <div className="md:col-span-3 space-y-3">
                      <label className="text-[10px] uppercase font-black text-white/30 block ml-1 tracking-widest">{t("ageLimitLabel")}</label>
                      <div className="flex gap-2">
                        <input type="number" placeholder={t("minAgePlaceholder")} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-center font-mono" value={cls.minAge} onChange={(e) => updateClass(cls.id, "minAge", e.target.value)} />
                        <input type="number" placeholder={t("maxAgePlaceholder")} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-center font-mono" value={cls.maxAge} onChange={(e) => updateClass(cls.id, "maxAge", e.target.value)} />
                      </div>
                      <input type="number" placeholder={t("participantLimitPlaceholder")} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-sm" value={cls.maxParticipants} onChange={(e) => updateClass(cls.id, "maxParticipants", e.target.value)} />
                    </div>
                    <div className="md:col-span-4 space-y-3">
                      <label className="text-[10px] uppercase font-black text-white/30 block ml-1 tracking-widest">{t("feesLabel")}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[9px] text-green-500 ml-1">{t("feeRegularLabel")}</span>
                            <input type="number" className="w-full bg-green-500/5 border border-green-500/20 rounded-xl p-2 text-green-400 font-bold" value={cls.feeRegular} onChange={(e) => updateClass(cls.id, "feeRegular", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] text-red-500 ml-1">{t("feeLateLabel")}</span>
                            <input type="number" className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-2 text-red-400 font-bold" value={cls.feeLate} onChange={(e) => updateClass(cls.id, "feeLate", e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeClass(cls.id)} className="text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 p-2 rounded-lg transition-all"><TrashIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
              {activeClasses.length === 0 && (
                  <p className="text-center text-white/20 italic py-4">{t("noClassesHint")}</p>
              )}
            </div>
          </div>

          {/* EXTRAS */}
          <div className="space-y-4 border-t border-gray-800 pt-6">
            <p className="text-white font-bold">{t("extrasTitle")}</p>
            {form.extras.map((ex, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input className={inputStyle} placeholder={t("extraNamePlaceholder")} value={ex.name} onChange={e => updateExtra(i, "name", e.target.value)} />
                <input type="number" className={inputStyle} placeholder={t("extraPricePlaceholder")} value={ex.price} onChange={e => updateExtra(i, "price", e.target.value)} />
                <button type="button" className="text-red-500 text-sm border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition h-10" onClick={() => removeExtra(i)}>
                  {t("removeBtn")}
                </button>
              </div>
            ))}
            <button type="button" className="text-blue-400 text-sm border border-blue-500/30 px-4 py-2 rounded hover:bg-blue-500/10 transition" onClick={addExtra}>
              + {t("addExtraBtn")}
            </button>
          </div>

          {/* DOKUMENTE */}
          <div className="space-y-4 border-t border-gray-800 pt-6">
              <label className="text-white font-bold block">{t("documentsLabel")}</label>
              <div ref={dropRef} onDragOver={e => e.preventDefault()} onDrop={handleDrop} className="border-2 border-dashed border-gray-600 p-8 rounded-xl text-gray-400 text-center hover:border-blue-500 transition cursor-pointer">
                {t("dropzoneText")}
              </div>
              <ul className="grid grid-cols-1 gap-2">
                {form.documents.map((doc, i) => (
                  <li key={i} className="text-gray-300 text-sm flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="truncate max-w-[80%]">{doc.name}</span>
                    <button type="button" onClick={() => setForm({...form, documents: form.documents.filter((_, idx) => idx !== i)})} className="text-red-400 font-bold hover:scale-110 transition px-2">×</button>
                  </li>
                ))}
              </ul>
          </div>

          <div className="pt-6">
            <button className="w-full bg-blue-700 hover:bg-blue-600 py-4 rounded-xl text-white font-bold text-lg shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98]">
              {t("saveChangesBtn")}
            </button>
          </div>

        </form>
      </div>
  );
}