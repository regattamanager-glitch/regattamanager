'use client';

import { useTranslations } from "next-intl";
import { Shield, Lock, UserCheck, Database } from "lucide-react"; // Optional: Falls du Lucide Icons nutzt

export default function DatenschutzPage() {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-[#0b1120] md:rounded-[2.5rem] text-slate-300 font-sans pb-24 overflow-hidden relative">
      {/* Subtiler Hintergrund-Effekt */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        {/* Header mit Akzent */}
        <header className="mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-sky-500 rounded-full" />
            <span className="text-sky-500 uppercase tracking-[0.2em] text-xs font-bold">Security & Trust</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black italic uppercase text-white tracking-tighter">
            {t('privacyTitle')}
          </h1>
          <p className="text-slate-500 mt-4 font-medium">{t('standDate')}</p>
        </header>

        {/* Content Grid */}
        <div className="grid gap-12">
          {/* Sektion 1 */}
          <section className="group">
            <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-3 group-hover:text-sky-400 transition-colors">
              <span className="text-sky-500/50 text-sm font-mono">01</span>
              {t('privacySection1Title')}
            </h2>
            <div className="pl-8 border-l border-white/5 group-hover:border-sky-500/30 transition-colors">
              <p className="leading-relaxed text-slate-400">
                {t('privacySection1Text')}
              </p>
            </div>
          </section>

          {/* Sektion 2 */}
          <section className="group">
            <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-3 group-hover:text-sky-400 transition-colors">
              <span className="text-sky-500/50 text-sm font-mono">02</span>
              {t('privacySection2Title')}
            </h2>
            <div className="pl-8 border-l border-white/5 group-hover:border-sky-500/30 transition-colors">
              <p className="leading-relaxed text-slate-400">
                {t('privacySection2Text')}
              </p>
            </div>
          </section>

          {/* Sektion 3 */}
          <section className="group">
            <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-3 group-hover:text-sky-400 transition-colors">
              <span className="text-sky-500/50 text-sm font-mono">03</span>
              {t('privacySection3Title')}
            </h2>
            <div className="pl-8 border-l border-white/5 group-hover:border-sky-500/30 transition-colors">
              <p className="leading-relaxed text-slate-400">
                {t('privacySection3Text')}
              </p>
            </div>
          </section>

          {/* Sektion 4 */}
          <section className="group">
            <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-3 group-hover:text-sky-400 transition-colors">
              <span className="text-sky-500/50 text-sm font-mono">04</span>
              {t('privacySection4Title')}
            </h2>
            <div className="pl-8 border-l border-white/5 group-hover:border-sky-500/30 transition-colors">
              <p className="leading-relaxed text-slate-400">
                {t('privacySection4Text')}
              </p>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-sm text-slate-600 italic">
            {t('footerFramework')}
          </p>
        </footer>
      </div>
    </div>
  );
}