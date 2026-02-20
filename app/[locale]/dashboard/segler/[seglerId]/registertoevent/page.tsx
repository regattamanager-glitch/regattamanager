'use client';

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";
import { User, Anchor, Users, Trash2, CreditCard, Info, ChevronRight, Phone, ShieldAlert, Award, ShoppingBag } from "lucide-react";
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";

// --- Interfaces bleiben gleich ---
interface Person {
  id?: string;
  vorname?: string;
  nachname?: string;
  nation: string;
  email?: string;
  geburtsdatum?: string;
  lizenzNummer?: string;
  telefon?: string;
  geschlecht?: "m" | "w";
  notfallKontakt?: string;
  sponsor?: string;
}

interface Skipper extends Person {
  seglerId: string;
  name: string;
  verein?: string;
  geburtsTag?: string;
  geburtsMonat?: string;
  geburtsJahr?: string;
  worldSailingId?: string;
}

interface BootInfo {
  bootName?: string; 
  segelnummer: string;
  countryCode: string;
}

type CrewMember = Person & {
  name: string;
  verein?: string;
  geburtsTag?: string;
  geburtsMonat?: string;
  geburtsJahr?: string;
};

export default function RegisterToEventPage() {
  const t = useTranslations("Register");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const eventId = searchParams.get("eventId");
  const klasseFromUrl = searchParams.get("klasse");
  const seglerIdFromPath = params.seglerId as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customKlasse, setCustomKlasse] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number; quantity: number }[]>([]);

  const [skipper, setSkipper] = useState<Skipper>({
    seglerId: "",
    name: "",
    nation: "",
    email: "",
    verein: "",
    telefon: "",
    geschlecht: "m",
    lizenzNummer: "",
    notfallKontakt: "",
    sponsor: "",
    geburtsTag: "",   
    geburtsMonat: "", 
    geburtsJahr: ""   
  });

  const [boot, setBoot] = useState<BootInfo>({
    bootName: "",
    segelnummer: "",
    countryCode: "", 
  });

  const [crew, setCrew] = useState<CrewMember[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events?eventId=${eventId}`);
        const eventData = await eventRes.json();
        setEvent(eventData);

        if (eventData.extras && eventData.extras.length > 0) {
          const initialExtras = eventData.extras.map((e: any) => ({
            name: e.name,
            price: Number(e.price),
            quantity: 0
          }));
          setSelectedExtras(initialExtras);
        }

        if (seglerIdFromPath) {
          const accRes = await fetch(`/api/accounts?id=${seglerIdFromPath}`);
          const accData = await accRes.json();
          
          if (accData && !accData.error) {
            setSkipper(prev => ({
              ...prev,
              seglerId: accData.id || seglerIdFromPath,
              name: accData.vorname ? `${accData.vorname} ${accData.nachname || ""}`.trim() : (accData.name || ""),
              nation: accData.nation || "",
              email: accData.email || "",
              geburtsJahr: accData.geburtsjahr || "",
              geburtsMonat: accData.geburtsmonat || "",
              geburtsTag: accData.geburtstag || "",
              telefon: accData.telefon || "",
              verein: accData.verein || "",
              lizenzNummer: accData.lizenzNummer || accData.lizenznummer || "",
              worldSailingId: accData.worldSailingId || "",
            }));
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) fetchData();
  }, [eventId, seglerIdFromPath]);

  const handleSkipperChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setSkipper({ ...skipper, [e.target.name]: e.target.value as any });
  
  const handleBootChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBoot({ ...boot, [e.target.name]: e.target.value.toUpperCase() });
  };

  const calculateTotal = () => {
    const defaultRes = { subtotal: 0, fee: 0, total: 0 };
    if (!event) return defaultRes;
    const decodedKlasse = decodeURIComponent(klasseFromUrl || "");
    const baseFee = event.gebuehrenProKlasse?.[decodedKlasse]?.normal || 0;
    const extrasFee = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
    const subtotal = baseFee + extrasFee;
    const fee = subtotal * 0.08;
    return { subtotal, fee, total: subtotal + fee };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const usedKlasse = decodeURIComponent(klasseFromUrl || "");
  
    try {
      const sessionRes = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          seglerId: seglerIdFromPath,
          klasse: usedKlasse === "GLOBAL" ? customKlasse : usedKlasse,
          skipper,
          boot,
          crew,
          extras: selectedExtras,
        }),
      });
      const session = await sessionRes.json();
      if (session.url) window.location.href = session.url;
    } catch (err) {
      alert(t('errorPayment'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-sky-400 uppercase tracking-tighter">{t('loadingSync')}</p>
    </div>
  );

  const costs = calculateTotal();

  return (
    <div className="min-h-screen bg-[#0f172a]/90 text-slate-200 pb-20 font-sans">
      <div className="max-w-5xl mx-auto pt-12 px-4">
        
        <div className="bg-[#1e293b] border border-blue-500/20 rounded-2xl p-8 mb-10 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="bg-sky-500 p-4 rounded-xl shadow-sky-500/20 shadow-lg">
              <Anchor className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">{event.name}</h1>
              <p className="text-sky-400 font-bold flex items-center gap-2 mt-1 uppercase text-xs tracking-widest">
                <Info className="w-4 h-4" /> {t('classLabel')}: {decodeURIComponent(klasseFromUrl || "")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            <FormSection title={t('sectionSkipper')} icon={<User className="text-sky-400 w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputGroup label={t('labelFullName')} name="name" value={skipper.name} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelEmail')} name="email" type="email" value={skipper.email} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelClub')} name="verein" value={skipper.verein} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelNation')} name="nation" value={skipper.nation} onChange={handleSkipperChange} required />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{t('labelBirthdate')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="TT" maxLength={2} value={skipper.geburtsTag} onChange={e => setSkipper({...skipper, geburtsTag: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-lg py-2 text-center focus:border-sky-500 outline-none font-bold text-white transition-colors" />
                    <input placeholder="MM" maxLength={2} value={skipper.geburtsMonat} onChange={e => setSkipper({...skipper, geburtsMonat: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-lg py-2 text-center focus:border-sky-500 outline-none font-bold text-white transition-colors" />
                    <input placeholder="JJJJ" maxLength={4} value={skipper.geburtsJahr} onChange={e => setSkipper({...skipper, geburtsJahr: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-lg py-2 text-center focus:border-sky-500 outline-none font-bold text-white transition-colors" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{t('labelGender')}</label>
                  <select name="geschlecht" value={skipper.geschlecht} onChange={handleSkipperChange} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 focus:border-sky-500 outline-none font-bold text-white appearance-none cursor-pointer">
                    <option value="m">{t('genderM')}</option>
                    <option value="w">{t('genderW')}</option>
                  </select>
                </div>

                <InputGroup label={t('labelPhone')} name="telefon" placeholder="+49 123 456789" icon={<Phone className="w-3 h-3"/>} value={skipper.telefon} onChange={handleSkipperChange} />
                <InputGroup label={t('labelWSID')} name="worldSailingId" value={skipper.worldSailingId} onChange={handleSkipperChange} />
                <InputGroup label={t('labelLicense')} name="lizenzNummer" value={skipper.lizenzNummer} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelEmergency')} name="notfallKontakt" icon={<ShieldAlert className="w-3 h-3"/>} value={skipper.notfallKontakt} onChange={handleSkipperChange} />
                <InputGroup label={t('labelSponsor')} name="sponsor" icon={<Award className="w-3 h-3"/>} value={skipper.sponsor} onChange={handleSkipperChange} />
              </div>
            </FormSection>

            <FormSection title={t('sectionBoat')} icon={<Anchor className="text-sky-400 w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {decodeURIComponent(klasseFromUrl || "") === "GLOBAL" && (
                  <div className="md:col-span-2">
                    <InputGroup label={t('labelCustomClass')} value={customKlasse} onChange={(e:any) => setCustomKlasse(e.target.value)} required />
                  </div>
                )}
                <InputGroup label={t('labelBoatName')} name="bootName" value={boot.bootName} onChange={handleBootChange} />
                <InputGroup label={t('labelSailNo')} name="segelnummer" value={boot.segelnummer} onChange={handleBootChange} required />
                <InputGroup label={t('labelCountryCode')} name="countryCode" maxLength={3} value={boot.countryCode} onChange={handleBootChange} required />
              </div>
            </FormSection>

            {selectedExtras.length > 0 && (
              <FormSection title={t('sectionExtras')} icon={<ShoppingBag className="text-sky-400 w-5 h-5" />}>
                <div className="space-y-3">
                  {selectedExtras.map((extra, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#0f172a]/50 border border-slate-700 rounded-xl">
                      <div>
                        <p className="font-black text-white uppercase text-xs tracking-tight">{extra.name}</p>
                        <p className="text-sky-400 font-bold text-sm">{extra.price.toFixed(2)} €</p>
                      </div>
                      <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-600 rounded-lg p-1">
                        <button onClick={() => {
                          const copy = [...selectedExtras];
                          copy[idx].quantity = Math.max(0, copy[idx].quantity - 1);
                          setSelectedExtras(copy);
                        }} className="w-8 h-8 rounded-md hover:bg-slate-800 font-black text-white transition-colors">-</button>
                        <span className="w-4 text-center font-black text-white">{extra.quantity}</span>
                        <button onClick={() => {
                          const copy = [...selectedExtras];
                          copy[idx].quantity += 1;
                          setSelectedExtras(copy);
                        }} className="w-8 h-8 rounded-md bg-sky-600 text-white font-black hover:bg-sky-500 transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>
            )}

            <section className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                   <Users className="text-sky-400 w-5 h-5" /> {t('sectionCrew')}
                </h2>
                <button onClick={() => setCrew([...crew, { 
                    name: "", nation: "", verein: "", geschlecht: "m", geburtsTag: "", geburtsMonat: "", geburtsJahr: "", lizenzNummer: "", email: "", telefon: ""
                  } as CrewMember])} 
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all shadow-lg shadow-sky-600/20">
                  {t('btnResetCrew')}
                </button>
              </div>
              <div className="space-y-6">
                {crew.length === 0 && <p className="text-center text-slate-500 text-xs uppercase font-bold py-4">{t('noCrew')}</p>}
                {crew.map((member, i) => (
                  <div key={i} className="p-5 bg-[#0f172a]/40 border border-slate-700 rounded-xl relative group">
                    <button onClick={() => setCrew(crew.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-400 shadow-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label={t('labelFullName')} value={member.name} onChange={(e: any) => { const c = [...crew]; c[i].name = e.target.value; setCrew(c); }} required />
                      <InputGroup label={t('labelClub')} value={member.verein} onChange={(e: any) => { const c = [...crew]; c[i].verein = e.target.value; setCrew(c); }} />
                      <InputGroup label={t('labelNation')} value={member.nation} onChange={(e: any) => { const c = [...crew]; c[i].nation = e.target.value; setCrew(c); }} required />
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">{t('labelBirthdate')}</label>
                        <div className="flex gap-1">
                          <input placeholder="TT" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm font-bold text-white focus:border-sky-500 outline-none transition-colors" value={member.geburtsTag} onChange={(e: any) => { const c = [...crew]; c[i].geburtsTag = e.target.value; setCrew(c); }} />
                          <input placeholder="MM" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm font-bold text-white focus:border-sky-500 outline-none transition-colors" value={member.geburtsMonat} onChange={(e: any) => { const c = [...crew]; c[i].geburtsMonat = e.target.value; setCrew(c); }} />
                          <input placeholder="JJJJ" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm font-bold text-white focus:border-sky-500 outline-none transition-colors" value={member.geburtsJahr} onChange={(e: any) => { const c = [...crew]; c[i].geburtsJahr = e.target.value; setCrew(c); }} />
                        </div>
                      </div>

                      <InputGroup label={t('labelLicense')} value={member.lizenzNummer} onChange={(e: any) => { const c = [...crew]; c[i].lizenzNummer = e.target.value; setCrew(c); }} />
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">{t('labelGender')}</label>
                        <select value={member.geschlecht} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 text-sm font-bold text-white appearance-none focus:border-sky-500 outline-none cursor-pointer" onChange={(e: any) => { const c = [...crew]; c[i].geschlecht = e.target.value as any; setCrew(c); }}>
                          <option value="m">{t('genderM')}</option>
                          <option value="w">{t('genderW')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-sky-900/10 border border-sky-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter text-white">
                <CreditCard className="text-sky-400 w-6 h-6" /> {t('checkoutHeader')}
              </h2>
              <div className="space-y-3 mb-8">
                <PriceRow label={t('feeRegatta')} value={costs.subtotal} />
                <PriceRow label={t('feeService')} value={costs.fee} />
                <div className="h-px bg-slate-700 my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-sky-400 tracking-widest">{t('labelTotal')}</span>
                  <span className="text-3xl font-black text-white">{costs.total.toFixed(2)} €</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 py-4 rounded-xl font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 group"
              >
                {submitting ? t('btnProcessing') : t('btnPayNow')}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[9px] text-slate-500 mt-4 uppercase text-center font-bold tracking-tighter">
                {t('securePaymentNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Hilfskomponenten (mit Props-Typen für i18n) ---
function FormSection({ title, icon, children }: any) {
  return (
    <section className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        {icon}
        <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InputGroup({ label, name, type = "text", value, onChange, required = false, icon = null }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
        {label} {required && <span className="text-sky-500">*</span>}
        {icon && <span className="opacity-50">{icon}</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""} 
        onChange={onChange}
        required={required}
        autoComplete="off"
        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 outline-none font-bold text-white text-sm transition-all placeholder:text-slate-600"
      />
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="font-black text-white">{value.toFixed(2)} €</span>
    </div>
  );
}