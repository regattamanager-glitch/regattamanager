'use client';

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";
import { 
  User, Anchor, Users, Trash2, CreditCard, ChevronRight, 
  Phone, ShieldAlert, Award, Save, Search, Loader2, Plus, Minus 
} from "lucide-react";
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";

// --- Interfaces ---
interface Person {
  id?: string;
  vorname?: string;
  nachname?: string;
  nation: string;
  email?: string;
  geburtsjahr?: string;
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

export default function ManualRegistrationPage() {
  const t = useTranslations("Register");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const eventId = searchParams.get("eventId");
  const klasseFromUrl = searchParams.get("klasse");
  const vereinId = params.vereinId as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedKlasse, setSelectedKlasse] = useState(klasseFromUrl || "");
  
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number; quantity: number }[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // 1. Event Daten laden & Extras initialisieren
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      try {
        const eventRes = await fetch(`/api/events?eventId=${eventId}`);
        if (!eventRes.ok) throw new Error("Event failed to load");
        
        const eventData = await eventRes.json();
        setEvent(eventData);

        if (eventData.extras?.length > 0) {
          setSelectedExtras(eventData.extras.map((e: any) => ({
            name: e.name,
            price: Number(e.price),
            quantity: 0
          })));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  // 2. Segler Suche (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (userSearch.length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/users?search=${encodeURIComponent(userSearch)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error("Search error", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearch]);

  const selectSegler = (user: any) => {
    setSkipper({
      ...skipper,
      seglerId: String(user.id),
      name: `${user.vorname} ${user.nachname}`,
      email: user.email || "",
      verein: user.verein || "",
      nation: user.nation || "",
      lizenzNummer: user.lizenzNummer || "",
      worldSailingId: user.worldSailingId || "",
      telefon: user.telefon || "",
      geburtsJahr: user.geburtsjahr ? String(user.geburtsjahr) : "",
      geburtsTag: "", 
      geburtsMonat: "",
    });
    setSearchResults([]);
    setUserSearch("");
  };

  const calculateTotal = () => {
    const defaultRes = { subtotal: 0, extrasTotal: 0, fee: 0, total: 0 };
    if (!event || !selectedKlasse) return defaultRes;
    
    const baseFee = event.gebuehrenProKlasse?.[selectedKlasse]?.normal || 0;
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
    const subtotal = baseFee + extrasTotal;
    const fee = subtotal * 0.08; 
    return { subtotal: baseFee, extrasTotal, fee, total: subtotal + fee };
  };

  const handleSkipperChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setSkipper({ ...skipper, [e.target.name]: e.target.value as any });
  
  const handleBootChange = (e: ChangeEvent<HTMLInputElement>) => 
    setBoot({ ...boot, [e.target.name]: e.target.value.toUpperCase() });

  const updateExtraQuantity = (index: number, delta: number) => {
    const newExtras = [...selectedExtras];
    newExtras[index].quantity = Math.max(0, newExtras[index].quantity + delta);
    setSelectedExtras(newExtras);
  };

  const handleSubmit = async () => {
    if (!selectedKlasse) return alert(t('errorSelectClass'));
    if (!confirm(t('confirmManualEntry'))) return;
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/registrations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          klasse: selectedKlasse,
          skipper,
          boot,
          crew,
          extras: selectedExtras.filter(e => e.quantity > 0),
          status: "PAID",
          paymentMethod: "MANUAL_ENTRY"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Save error");
      }
      
      router.push(`/dashboard/verein/${vereinId}/registrationlist?eventId=${eventId}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-sky-400 font-black italic">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      {t('loadingManager')}
    </div>
  );

  const costs = calculateTotal();

  return (
    <div className="min-h-screen bg-[#0f172a]/90 text-slate-200 pb-20 font-sans">
      <div className="max-w-5xl mx-auto pt-12 px-4">
        
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors group"
        >
          <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-sky-500/20">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{t('backToOverview')}</span>
        </button>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldAlert className="text-amber-500 w-6 h-6" />
            <p className="text-amber-200 text-sm font-bold uppercase tracking-tight">
              {t('adminEntry')}: <span className="text-white ml-2">{event?.name}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            <FormSection title={t('sectionSkipper')} icon={<User className="text-sky-400 w-5 h-5" />}>
              <div className="mb-6 p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl relative">
                <label className="text-[10px] font-black uppercase text-sky-400 mb-2 block tracking-widest">{t('searchAccount')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-sky-500" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-2">
                    {searchResults.map((u) => (
                      <button key={u.id} onClick={() => selectSegler(u)} className="w-full text-left p-3 hover:bg-sky-500/10 rounded-lg flex justify-between items-center group transition-colors">
                        <div>
                          <p className="font-bold text-white text-sm">{u.vorname} {u.nachname}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black">{u.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputGroup label={t('labelFullName')} name="name" value={skipper.name} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelEmail')} name="email" type="email" value={skipper.email} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelClub')} name="verein" value={skipper.verein} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelNation')} name="nation" value={skipper.nation} onChange={handleSkipperChange} required />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{t('labelBirthdate')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="TT" maxLength={2} value={skipper.geburtsTag} onChange={e => setSkipper({...skipper, geburtsTag: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-lg py-2.5 text-center focus:border-sky-500 outline-none font-bold text-white text-sm" />
                    <input placeholder="MM" maxLength={2} value={skipper.geburtsMonat} onChange={e => setSkipper({...skipper, geburtsMonat: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-lg py-2.5 text-center focus:border-sky-500 outline-none font-bold text-white text-sm" />
                    <input placeholder="JJJJ" maxLength={4} value={skipper.geburtsJahr} onChange={e => setSkipper({...skipper, geburtsJahr: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-lg py-2.5 text-center focus:border-sky-500 outline-none font-bold text-white text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{t('labelGender')}</label>
                  <select name="geschlecht" value={skipper.geschlecht} onChange={handleSkipperChange} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 focus:border-sky-500 outline-none font-bold text-white text-sm appearance-none cursor-pointer">
                    <option value="m">{t('genderM')}</option>
                    <option value="w">{t('genderW')}</option>
                  </select>
                </div>

                <InputGroup label={t('labelPhone')} name="telefon" placeholder="+49..." icon={<Phone className="w-3 h-3"/>} value={skipper.telefon} onChange={handleSkipperChange} />
                <InputGroup label={t('labelLicense')} name="lizenzNummer" value={skipper.lizenzNummer} onChange={handleSkipperChange} required />
                <InputGroup label={t('labelWSID')} name="worldSailingId" value={skipper.worldSailingId} onChange={handleSkipperChange} />
                <InputGroup label={t('labelSponsor')} name="sponsor" icon={<Award className="w-3 h-3"/>} value={skipper.sponsor} onChange={handleSkipperChange} />
                <InputGroup label={t('labelEmergencyContact')} name="notfallKontakt" value={skipper.notfallKontakt} onChange={handleSkipperChange} />
              </div>
            </FormSection>

            <FormSection title={t('sectionBoat')} icon={<Anchor className="text-sky-400 w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{t('labelSelectClass')} *</label>
                  <select 
                    value={selectedKlasse} 
                    onChange={(e) => setSelectedKlasse(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 focus:border-sky-500 outline-none font-bold text-white appearance-none cursor-pointer text-sm"
                  >
                    <option value="">{t('selectPlaceholder')}</option>
                    {event?.bootsklassen?.map((k: string) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                
                <InputGroup label={t('labelBoatName')} name="bootName" value={boot.bootName} onChange={handleBootChange} />
                <InputGroup label={t('labelSailNo')} name="segelnummer" value={boot.segelnummer} onChange={handleBootChange} required />
                <InputGroup label={t('labelCountryCode')} name="countryCode" maxLength={3} value={boot.countryCode} onChange={handleBootChange} required />
              </div>
            </FormSection>

            <FormSection title={t('sectionExtras')} icon={<Award className="text-sky-400 w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedExtras.map((extra, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#0f172a]/40 border border-slate-700 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-white">{extra.name}</p>
                      <p className="text-[10px] text-sky-400 font-black uppercase">{extra.price.toFixed(2)} €</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateExtraQuantity(idx, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg hover:bg-red-500/20 text-white transition-all"><Minus className="w-3 h-3" /></button>
                      <span className="w-4 text-center font-black text-sky-400 text-sm">{extra.quantity}</span>
                      <button onClick={() => updateExtraQuantity(idx, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg hover:bg-emerald-500/20 text-white transition-all"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
                {selectedExtras.length === 0 && <p className="text-slate-500 text-[10px] uppercase font-bold py-4 italic">{t('noExtrasAvailable')}</p>}
              </div>
            </FormSection>

            <section className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                   <Users className="text-sky-400 w-5 h-5" /> {t('sectionCrew')}
                </h2>
                <button onClick={() => setCrew([...crew, { 
                    name: "", nation: "", verein: "", geschlecht: "m", geburtsJahr: "", lizenzNummer: ""
                  } as any])} 
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all">
                  {t('addCrewMember')}
                </button>
              </div>
              <div className="space-y-6">
                {crew.length === 0 && <p className="text-center text-slate-500 text-[10px] uppercase font-bold py-4">{t('noCrewEntered')}</p>}
                {crew.map((member, i) => (
                  <div key={i} className="p-5 bg-[#0f172a]/40 border border-slate-700 rounded-xl relative group">
                    <button onClick={() => setCrew(crew.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-400 shadow-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label={t('labelFullName')} value={member.name} onChange={(e: any) => { const c = [...crew]; c[i].name = e.target.value; setCrew(c); }} required />
                      <InputGroup label={t('labelClub')} value={member.verein} onChange={(e: any) => { const c = [...crew]; c[i].verein = e.target.value; setCrew(c); }} />
                      <InputGroup label={t('labelNation')} value={member.nation} onChange={(e: any) => { const c = [...crew]; c[i].nation = e.target.value; setCrew(c); }} required />
                      <InputGroup label={t('labelLicense')} value={member.lizenzNummer} onChange={(e: any) => { const c = [...crew]; c[i].lizenzNummer = e.target.value; setCrew(c); }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-sky-900/10 border border-sky-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter text-white">
                <CreditCard className="text-sky-400 w-6 h-6" /> {t('summaryTitle')}
              </h2>
              <div className="space-y-3 mb-8">
                <PriceRow label={t('feeRegistration')} value={costs.subtotal} />
                
                {selectedExtras.filter(e => e.quantity > 0).map((e, i) => (
                  <PriceRow key={i} label={`${e.quantity}x ${e.name}`} value={e.price * e.quantity} />
                ))}

                <PriceRow label={t('feeService')} value={costs.fee} />
                <div className="h-px bg-slate-700 my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-sky-400 tracking-widest">{t('total')}</span>
                  <span className="text-3xl font-black text-white">{costs.total.toFixed(2)} €</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedKlasse}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-4 rounded-xl font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              >
                {submitting ? t('saving') : t('saveRegistration')}
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Hilfskomponenten ---
function FormSection({ title, icon, children }: any) {
  return (
    <section className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        {icon}
        <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InputGroup({ label, name, type = "text", value, onChange, required = false, icon = null, maxLength }: any) {
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
        maxLength={maxLength}
        autoComplete="off"
        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 focus:border-sky-500 outline-none font-bold text-white text-sm transition-all"
      />
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="font-black text-white">{(value || 0).toFixed(2)} €</span>
    </div>
  );
}