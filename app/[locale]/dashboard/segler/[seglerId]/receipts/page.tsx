'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  Receipt, ArrowLeft, Clock, Anchor, 
  CreditCard, Download, Calculator
} from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/de';
import 'dayjs/locale/en'; // Falls Englisch unterstützt wird
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function SeglerReceiptsPage() {
  const t = useTranslations("Receipts");
  const locale = useLocale();
  const params = useParams();
  const seglerId = params?.seglerId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [segler, setSegler] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  // Dayjs an Sprache anpassen
  useEffect(() => {
    dayjs.locale(locale);
  }, [locale]);

  async function loadReceiptData() {
    try {
      setLoading(true);
      const [resEvents, resAccounts] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/accounts')
      ]); 

      const allEvents = await resEvents.json();
      const allAccounts = await resAccounts.json();

      const currentSegler = allAccounts.find((acc: any) => String(acc.id).trim() === seglerId);
      setSegler(currentSegler);

      const seglerEvents: any[] = [];
      let total = 0;

      allEvents.forEach((event: any) => {
        if (!event.segler) return;

        Object.entries(event.segler).forEach(([klasse, participants]: [string, any]) => {
          const partArray = participants as any[];
          const participantEntry = partArray.find(p => 
            String(p.skipper?.seglerId || p.seglerId || "").trim() === seglerId
          );

          if (participantEntry) {
            const classInfo = event.gebuehrenProKlasse?.[klasse];
            const eventCost = classInfo?.normal ? parseFloat(classInfo.normal) : 0;
            
            const selectedExtraIds = participantEntry.extras || [];
            let extrasCost = 0;
            if (selectedExtraIds.length > 0 && event.extras) {
              selectedExtraIds.forEach((extraId: any) => {
                const searchId = typeof extraId === 'object' ? extraId.id : extraId;
                const extraDef = event.extras.find((e: any) => e.id === searchId);
                if (extraDef) extrasCost += parseFloat(extraDef.price || extraDef.kosten || 0);
              });
            }

            const subtotal = eventCost + extrasCost;
            const serviceFee = subtotal * 0.08; 
            const totalItemCost = subtotal + serviceFee;
            
            total += totalItemCost;

            seglerEvents.push({
              eventId: event.id,
              eventName: event.name || event.titel,
              datum: event.datumVon,
              klasse,
              baseCost: eventCost,
              extrasCost: extrasCost,
              serviceFee: serviceFee,
              cost: totalItemCost,
              location: event.location
            });
          }
        });
      });

      setReceipts(seglerEvents.sort((a, b) => dayjs(b.datum).diff(dayjs(a.datum))));
      setTotalCost(total);
    } catch (err) {
      console.error("Error loading receipts:", err);
    } finally {
      setLoading(false);
    }
  }

  const downloadReceipt = (item: any) => {
    const doc = new jsPDF();
    const dateStr = dayjs(item.datum).format('DD.MM.YYYY');
    const receiptNumber = `RE-${item.eventId.substring(0, 5)}-${Math.floor(Math.random() * 1000)}`;

    // PDF Übersetzungen
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(t('pdfTitle'), 14, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`${t('pdfReceiptNo')}: ${receiptNumber}`, 14, 32);
    doc.text(`${t('pdfIssueDate')}: ${dayjs().format('DD.MM.YYYY')}`, 14, 37);

    doc.setDrawColor(230);
    doc.line(14, 45, 196, 45);

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(t('pdfEventHeader'), 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.eventName}`, 14, 60);
    doc.text(`${t('pdfLocation')}: ${item.location || 'N/A'}`, 14, 65);
    doc.text(`${t('pdfDate')}: ${dateStr}`, 14, 70);

    doc.setFont("helvetica", "bold");
    doc.text(t('pdfParticipantHeader'), 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`${segler?.vorname} ${segler?.nachname}`, 120, 60);
    doc.text(`ID: ${seglerId}`, 120, 65);

    autoTable(doc, {
      startY: 80,
      head: [[t('tablePos'), t('tableDetails'), t('tableAmount')]],
      body: [
        [t('posEntryFee'), `${t('tableClass')}: ${item.klasse}`, `${(item.baseCost || 0).toFixed(2)} €`],
        [t('posExtras'), t('posExtrasDetail'), `${(item.extrasCost || 0).toFixed(2)} €`],
        [t('posServiceFee'), t('posServiceFeeDetail'), `${(item.serviceFee || 0).toFixed(2)} €`],
      ],
      foot: [
        [t('totalAmount'), '', { content: `${(item.cost || 0).toFixed(2)} €`, styles: { fontStyle: 'bold', fontSize: 12 } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [240, 249, 255], textColor: [14, 165, 233] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    doc.text(t('pdfNoteAutomated'), 14, finalY);
    doc.text(t('pdfNoteSystem'), 14, finalY + 5);

    doc.save(`${t('pdfFileName')}_${item.eventName.replace(/\s+/g, '_')}.pdf`);
  };

  useEffect(() => {
    if (seglerId) loadReceiptData();
  }, [seglerId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-100 p-6 md:p-12 font-sans">
      <header className="max-w-5xl mx-auto mb-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-sky-400 transition-all mb-8">
          <ArrowLeft size={14} /> {t('back')}
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-3 font-black uppercase tracking-[0.3em] text-[10px]">
              <Receipt size={18} /> {t('labelHeader')}
            </div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
              {t('titlePart1')} <span className="text-sky-500">{t('titlePart2')}</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
              {t('sailorLabel')}: {segler?.vorname} {segler?.nachname}
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-md">
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('totalExpenses')}</div>
            <div className="text-4xl font-black text-white italic">
              {totalCost.toFixed(2)}€
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="space-y-4">
          {receipts.map((item, i) => (
            <div 
              key={i}
              className="group bg-white/5 border border-white/10 hover:border-sky-500/50 rounded-[2rem] p-6 transition-all backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-tight">{item.eventName}</h3>
                  <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Clock size={12} /> {dayjs(item.datum).format('DD. MMM YYYY')}</span>
                    <span className="flex items-center gap-1"><Anchor size={12} /> {item.klasse}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <div className="text-right">
                  <div className="text-2xl font-black text-white italic">
                    {item.cost.toFixed(2)}€
                  </div>
                  <div className="text-[8px] font-bold text-sky-400 uppercase tracking-tight">
                    {t('includingDetails', { amount: (item.extrasCost + item.serviceFee).toFixed(2) })}
                  </div>
                  <div className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                    {t('statusPaid')}
                  </div>
                </div>
                <button 
                  onClick={() => downloadReceipt(item)}
                  className="p-4 bg-white/5 hover:bg-sky-500 text-white rounded-2xl transition-all active:scale-95"
                  title={t('tooltipDownload')}
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          ))}

          {receipts.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Calculator className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">{t('noReceipts')}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          {t('footerCopyright', { year: 2026 })}
        </p>
      </footer>
    </div>
  );
}