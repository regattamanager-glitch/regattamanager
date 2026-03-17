'use client';

import { useTranslations } from "next-intl";
import { Scale, CreditCard, Users, RefreshCcw, AlertTriangle } from "lucide-react";

export default function AGBPage() {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-[#0b1120] md:rounded-[2.5rem] text-slate-300 font-sans pb-24 relative overflow-hidden">
      {/* Hintergrund-Deko für Tiefe */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        <header className="mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-sky-500 rounded-full" />
            <span className="text-sky-500 uppercase tracking-[0.2em] text-xs font-bold">Legal Framework</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black italic uppercase text-white tracking-tighter">
            {t('agbTitleMain')} <span className="text-sky-500">{t('agbTitleHighlight')}</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest mt-4 text-xs">
            {t('standDate')}
          </p>
        </header>

        <div className="grid gap-8">
          
          {/* Sektion 1 - Geltungsbereich */}
          <section className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-12 w-12 rounded-2xl bg-sky-500/10 items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <Scale size={24} />
              </div>
              <div>
                <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-3">
                  <span className="text-sky-500/40 font-mono text-xl">01.</span> {t('section1Title')}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  {t('section1Text')}
                </p>
              </div>
            </div>
          </section>

          {/* Sektion 2 - Gebühren */}
          <section className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-12 w-12 rounded-2xl bg-sky-500/10 items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <div>
                <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-3">
                  <span className="text-sky-500/40 font-mono text-xl">02.</span> {t('section2Title')}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  {t('section2TextPrefix')} 
                  <strong className="text-sky-400 font-bold"> {t('section2TextHighlight')}</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Sektion 3 - Vertrag */}
          <section className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-12 w-12 rounded-2xl bg-sky-500/10 items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-3">
                  <span className="text-sky-500/40 font-mono text-xl">03.</span> {t('section3Title')}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  {t('section3Text')}
                </p>
              </div>
            </div>
          </section>

          {/* Sektion 4 - Stornierung */}
          <section className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-12 w-12 rounded-2xl bg-sky-500/10 items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <RefreshCcw size={24} />
              </div>
              <div>
                <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-3">
                  <span className="text-sky-500/40 font-mono text-xl">04.</span> {t('section4Title')}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  {t('section4TextPart1')} 
                  <strong className="text-white border-b border-sky-500/50 pb-0.5"> {t('section4TextHighlightContact')}</strong> 
                  {" "}{t('section4TextPart2')}
                  <strong className="text-red-400 ml-1"> {t('section4TextHighlightFee')}</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Sektion 5 - Haftung */}
          <section className="group bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-12 w-12 rounded-2xl bg-red-500/10 items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div className="w-full">
                <h2 className="text-white font-black uppercase italic mb-6 flex items-center gap-3">
                  <span className="text-red-500/40 font-mono text-xl">05.</span> {t('section5Title')}
                </h2>
                <div className="space-y-6 text-sm">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <strong className="text-sky-400 block mb-1 uppercase text-xs tracking-widest">{t('section5_1_SubTitle')}</strong>
                    <p className="text-slate-400">{t('section5_1_Text')}</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <strong className="text-sky-400 block mb-1 uppercase text-xs tracking-widest">{t('section5_2_SubTitle')}</strong>
                    <p className="text-slate-400">{t('section5_2_Text')}</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-red-500/[0.03] border border-red-500/20 italic shadow-inner">
                    <strong className="text-red-500 block mb-1 not-italic uppercase text-xs tracking-widest">{t('section5_3_SubTitle')}</strong>
                    <p className="text-red-200/70">{t('section5_3_Text')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-24 pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.5em] font-black">
            {t('footerFramework')}
          </p>
        </footer>
      </div>
    </div>
  );
}