'use client';

import { Link } from '@/navigation';
import { ShieldCheck, Scale, Mail, Anchor } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/5 bg-[#0f172a]/80 backdrop-blur-xl py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-sky-500 rounded-lg">
                <Anchor size={20} className="text-white" />
              </div>
              <span className="text-xl font-black italic tracking-tighter text-white uppercase">
                Regatta<span className="text-sky-500">Manager</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
              {t('description')}
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2">
              <Scale size={14} className="text-sky-500" /> {t('legalTitle')}
            </h4>
            <ul className="space-y-4 text-sm font-bold uppercase tracking-wider">
              <li>
                <Link href="/impressum" className="text-slate-400 hover:text-sky-400 transition-colors">
                  {t('impressum')}
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-slate-400 hover:text-sky-400 transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-slate-400 hover:text-sky-400 transition-colors">
                  {t('tos')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Fee Info */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> {t('securityTitle')}
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed font-bold uppercase">
              {t('securityText')}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2">
              <Mail size={14} className="text-sky-500" /> {t('supportTitle')}
            </h4>
            <p className="text-slate-400 text-sm font-bold mb-2">regattamanagerverify@gmail.com</p>
            <p className="text-slate-600 text-[10px] uppercase font-black">
              {t('supportResponse')}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            &copy; {currentYear} {t('copyright')}
          </p>
          <div className="flex gap-6">
             <div className="flex items-center gap-2 grayscale opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-8 h-5 bg-white/10 rounded" />
                <div className="w-8 h-5 bg-white/10 rounded" />
                <div className="w-8 h-5 bg-white/10 rounded" />
             </div> 
          </div>
        </div>
      </div>
    </footer>
  );
}