'use client';

import { Link } from '@/navigation';
import { ShieldCheck, Scale, Mail, Anchor, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/5 bg-[#0b1120]/80 backdrop-blur-xl py-16 px-6 relative overflow-hidden">
      {/* Subtiler Glow Effekt im Footer */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-500/5 blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6 group cursor-default">
              <div className="p-2.5 bg-sky-500 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Anchor size={22} className="text-white" />
              </div>
              <span className="text-2xl font-black italic tracking-tighter text-white uppercase">
                Regatta<span className="text-sky-500 font-black">Manager</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed italic border-l-2 border-white/5 pl-4">
              {t('description')}
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-2">
              <Scale size={14} className="text-sky-500" /> {t('legalTitle')}
            </h4>
            <ul className="space-y-4">
              {['impressum', 'privacy', 'tos'].map((key) => (
                <li key={key}>
                  <Link 
                    href={key === 'privacy' ? '/datenschutz' : `/${key}`} 
                    className="text-slate-400 hover:text-sky-400 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 group"
                  >
                    <div className="h-px w-0 bg-sky-500 group-hover:w-3 transition-all" />
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Service Fee Info */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> {t('securityTitle')}
            </h4>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 group hover:border-emerald-500/20 transition-colors">
              <p className="text-slate-400 text-[11px] leading-relaxed font-bold uppercase tracking-tight">
                {t('securityText')}
              </p>
              <div className="mt-3 flex items-center gap-2 text-emerald-500/50 text-[10px] font-black uppercase">
                <CreditCard size={12} /> SSL Encrypted
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-2">
              <Mail size={14} className="text-sky-500" /> {t('supportTitle')}
            </h4>
            <div className="space-y-4">
              <a 
                href="mailto:regattamanagerverify@gmail.com" 
                className="text-white hover:text-sky-400 transition-colors text-sm font-bold block truncate"
              >
                regattamanagerverify@gmail.com
              </a>
              <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/5 border border-white/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-slate-500 text-[10px] uppercase font-black tracking-tighter">
                  {t('supportResponse')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
              &copy; {currentYear} {t('copyright')}
            </p>
            <p className="text-[9px] text-slate-700 font-bold uppercase">
              Powered by Regatta Manager Digital Legal Framework
            </p>
          </div>
          
          {/* Payment Badges - Jetzt etwas schöner */}
          <div className="flex items-center gap-4 bg-white/[0.02] px-6 py-3 rounded-2xl border border-white/5">
             <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest mr-2">Secure Payments</span>
             <div className="flex gap-3 grayscale opacity-40">
                {/* Platzhalter für Visa, MC, Stripe Badges */}
                <div className="w-8 h-5 bg-white/10 rounded-sm" />
                <div className="w-8 h-5 bg-white/10 rounded-sm" />
                <div className="w-8 h-5 bg-white/10 rounded-sm" />
             </div> 
          </div>
        </div>
      </div>
    </footer>
  );
}