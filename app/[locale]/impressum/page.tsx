'use client';

import { useTranslations } from "next-intl";
import { Mail, MapPin, Fingerprint, Globe, ExternalLink } from "lucide-react";

export default function ImpressumPage() {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-[#0b1120] md:rounded-[2.5rem] text-slate-300 font-sans pb-24 relative overflow-hidden">
      {/* Subtile Hintergrund-Effekte */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        <header className="mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-sky-500 rounded-full" />
            <span className="text-sky-500 uppercase tracking-[0.2em] text-xs font-bold">Identity & Verification</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black italic uppercase text-white tracking-tighter">
            {t('impressumTitle')}
          </h1>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Betreiber Information */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                <MapPin size={20} />
              </div>
              <h2 className="text-white font-bold uppercase tracking-wider text-sm">
                {t('tmgNotice')}
              </h2>
            </div>
            <p className="text-slate-400 leading-relaxed pl-2 border-l-2 border-sky-500/20">
              Nicolas Feltz<br />
              Rue des Aubépines<br />
              L-1145 Luxemburg
            </p>
          </div>

          {/* Kontakt */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Mail size={20} />
              </div>
              <h2 className="text-white font-bold uppercase tracking-wider text-sm">
                {t('contactTitle')}
              </h2>
            </div>
            <div className="pl-2 border-l-2 border-sky-500/20">
              <p className="text-xs text-slate-500 uppercase mb-1">{t('emailLabel')}</p>
              <a href="mailto:regattamanagerverify@gmail.com" className="text-sky-400 hover:text-sky-300 transition-colors font-medium break-all">
                regattamanagerverify@gmail.com
              </a>
            </div>
          </div>

          {/* Steuer & ID */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Fingerprint size={20} />
              </div>
              <h2 className="text-white font-bold uppercase tracking-wider text-sm">
                {t('vatTitle')}
              </h2>
            </div>
            <div className="pl-2 border-l-2 border-sky-500/20">
              <p className="text-slate-400 text-sm mb-2">{t('vatText')}</p>
              <code className="bg-white/5 px-3 py-1 rounded-md text-sky-500 font-mono text-sm">
                DE123456789
              </code>
            </div>
          </div>

          {/* Streitschlichtung */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.04] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                  <Globe size={20} />
                </div>
                <h2 className="text-white font-bold uppercase tracking-wider text-sm">
                  {t('euDisputeTitle')}
                </h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {t('euDisputeText')}
              </p>
            </div>
            <a 
              href="https://ec.europa.eu/consumers/odr/" 
              target="_blank" 
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 rounded-xl text-sky-400 text-xs font-bold uppercase tracking-widest transition-all group"
            >
              OS Plattform <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.5em] font-black">
            Regatta Manager Digital Legal Framework
          </p>
        </footer>
      </div>
    </div>
  );
} 