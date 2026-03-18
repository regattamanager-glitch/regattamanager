'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Ship, AlertCircle, Trash2, ChevronDown, ChevronUp, Download, User, Tag } from 'lucide-react';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// NEUE KOMPONENTE: Lädt Bild und Skipper-Daten über die separate Route
function SkipperImage({ reg }: { reg: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Wir suchen die ID – probiere verschiedene Schreibweisen, falls eine falsch ist
  const id = reg.skipperId || reg.skipper_id || reg.skipper?.id;

  useEffect(() => {
    if (!id) {
      console.warn("Keine Skipper-ID für Registration gefunden:", reg.id);
      setLoading(false);
      return;
    }

    fetch(`/api/segler/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Segler nicht gefunden");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Seglers:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="w-full h-full bg-slate-800 animate-pulse" />;

  // WICHTIG: Prüfe hier, ob dein Feld in der DB wirklich "profilbild" heißt!
  const imageSrc = data?.profilbild || data?.image || data?.avatar;

  return imageSrc ? (
    <img src={imageSrc} alt="Profil" className="w-full h-full object-cover" />
  ) : (
    <div className="text-center opacity-20">
      <User size={30} className="mx-auto" />
      <span className="text-[7px] font-black uppercase">Kein Bild</span>
    </div>
  );
}

function RegistrationListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get('eventId');

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const regRes = await fetch(`/api/registrations?eventId=${eventId}`);
        const regs = regRes.ok ? await regRes.json() : [];
        
        if (regs.length > 0) console.log("Backend Check:", regs[0]);

        const eventRes = await fetch(`/api/events/${eventId}`);
        const event = eventRes.ok ? await eventRes.json() : { name: "Regatta Event" };

        setRegistrations(Array.isArray(regs) ? regs : []);
        setEventData(event);

        if (Array.isArray(regs)) {
          const initialStates: Record<string, boolean> = {};
          [...new Set(regs.map((r: any) => r.klasse))].forEach(c => { if(c) initialStates[c] = true });
          setExpandedClasses(initialStates);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const handleDelete = async (regId: string) => {
    if (!confirm("Anmeldung wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/registrations/${regId}`, { method: 'DELETE' });
      if (res.ok) setRegistrations(prev => prev.filter(r => r.id !== regId));
    } catch (err) { console.error(err); }
  };

  const memoizedGroups = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    registrations.forEach((reg: any) => {
      const klasse = reg.klasse || "Andere";
      const searchStr = `${reg.skipper?.name || ''} ${reg.boot?.segelnummer || ''} ${reg.skipper?.verein || ''}`.toLowerCase();
      
      if (searchStr.includes(searchTerm.toLowerCase())) {
        let baseCost = parseFloat(eventData?.gebuehren_pro_klasse?.[klasse]?.normal || "65.00");
        const extrasCost = (reg.extras || []).reduce((sum: number, e: any) => sum + (parseFloat(e.price || 0) * parseInt(e.quantity || 1)), 0);
        const serviceFee = (baseCost + extrasCost) * 0.08;
        
        if (!grouped[klasse]) grouped[klasse] = [];
        grouped[klasse].push({ ...reg, calculated: { baseCost, extrasCost, serviceFee, total: baseCost + extrasCost + serviceFee } });
      }
    });
    return grouped;
  }, [registrations, eventData, searchTerm]);

  const downloadInvoice = (reg: any) => {
    const doc = new jsPDF();
    const { baseCost, extrasCost, serviceFee, total } = reg.calculated;

    doc.setFont("helvetica", "bold").setFontSize(22);
    doc.text("QUITTUNG / BELEG", 14, 25);
    
    doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100);
    doc.text(`Beleg-Nr: RE-${reg.id.substring(0, 8).toUpperCase()}`, 14, 32);
    doc.text(`Datum: ${dayjs().format('DD.MM.YYYY')}`, 14, 37);

    doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0);
    doc.text("VERANSTALTUNG", 14, 55);
    doc.setFont("helvetica", "normal").text(`${eventData?.name || 'Regatta Event'}`, 14, 60);

    doc.setFont("helvetica", "bold").text("TEILNEHMER", 120, 55);
    doc.setFont("helvetica", "normal").text(`${reg.skipper?.name || 'Segler'}`, 120, 60);
    if (reg.skipper?.verein) doc.text(reg.skipper.verein, 120, 65);

    autoTable(doc, {
      startY: 75,
      head: [["Position", "Details", "Betrag"]],
      body: [
        ["Meldegeld / Startgebühr", `Klasse: ${reg.klasse}`, `${baseCost.toFixed(2)} €`],
        ["Extras / Optionen", reg.extras?.map((e: any) => `${e.quantity}x ${e.name}`).join(', ') || '-', `${extrasCost.toFixed(2)} €`],
        ["Service-Gebühr", "8% Systempauschale", `${serviceFee.toFixed(2)} €`],
      ],
      foot: [[
        { content: "GESAMTBETRAG", styles: { fontStyle: 'bold' } },
        "",
        { content: `${total.toFixed(2)} €`, styles: { fontStyle: 'bold', textColor: [0, 112, 192] } }
      ]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(8).setTextColor(150);
    const note = "Hinweis: Im Falle einer Stornierung muss der Segler den Verein kontaktieren. Die 8% Gebühr ist systembedingt nicht erstattungsfähig.";
    doc.text(doc.splitTextToSize(note, 180), 14, finalY);

    doc.save(`Beleg_${reg.skipper?.name || 'Anmeldung'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6">
      <div className="max-w-6xl mx-auto bg-slate-900/50 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md">
        <header className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <button onClick={() => router.back()} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold mb-2 uppercase tracking-tighter transition-all">
              <ArrowLeft size={14} /> ZURÜCK
            </button>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">MELDELISTE <span className="text-blue-500">MANAGEMENT</span></h1>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Suche..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all shadow-inner" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <main className="p-8">
          {loading ? <div className="text-center py-20 font-black uppercase text-slate-500">Lade Daten...</div> : 
            Object.entries(memoizedGroups).map(([className, regs]) => (
              <div key={className} className="mb-8">
                <button onClick={() => setExpandedClasses(p => ({...p, [className]: !p[className]}))} className="w-full flex items-center justify-between bg-slate-800/40 p-6 rounded-[1.5rem] border border-slate-700/50 hover:bg-slate-800 transition-all shadow-lg">
                  <span className="text-xl font-black italic uppercase tracking-tight text-white">{className} ({regs.length})</span>
                  {expandedClasses[className] ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedClasses[className] && (
                  <div className="mt-4 space-y-4">
                    {regs.map((reg) => (
                      <div key={reg.id} className="bg-slate-800/20 border border-white/5 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-blue-500/30 transition-all shadow-xl">
                        <div className="flex items-center gap-6 flex-1 w-full">
                          
                          {/* PROFILBILD FIX - JETZT ÜBER SkipperImage Komponente */}
                          <div className="w-24 h-24 bg-slate-900 rounded-[1.8rem] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
  <SkipperImage reg={reg} />
</div>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-5">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">{reg.skipper?.name}</h3>
                                
                                <div className="bg-blue-600 text-white px-5 py-2 rounded-xl font-mono text-2xl font-black shadow-lg border border-blue-400/20">
                                  #{reg.boot?.segelnummer || '---'}
                                </div>
                            </div>
                            
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{reg.skipper?.verein || 'Kein Verein'}</span>
                            
                            <div className="flex flex-wrap gap-2 mt-1">
                              {reg.extras?.map((e: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                                  <Tag size={12} className="text-blue-500" />
                                  <span className="text-xs font-bold text-blue-100 uppercase italic">
                                    {e.quantity}x {e.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                          {reg.paidAt && (
                            <button onClick={() => downloadInvoice(reg)} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-blue-600 transition-all flex flex-col items-center gap-1 group/btn shadow-lg">
                              <Download size={20} className="text-slate-400 group-hover/btn:text-white" />
                              <span className="text-[7px] font-black uppercase text-slate-500 group-hover/btn:text-white">BELEG</span>
                            </button>
                          )}
                          <span className={`px-5 py-3 rounded-2xl text-[10px] font-black border tracking-widest ${reg.paidAt ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {reg.paidAt ? 'PAID' : 'OFFEN'}
                          </span>
                          <button onClick={() => handleDelete(reg.id)} className="p-4 bg-red-500/5 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl border border-red-500/10 transition-all">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </main>
      </div>
    </div>
  );
}

export default function RegistrationListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Lade System...</div>}>
      <RegistrationListContent />
    </Suspense>
  );
}