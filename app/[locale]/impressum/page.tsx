'use client';

import { useTranslations } from "next-intl";

export default function ImpressumPage() {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 font-sans pb-12">
      <div className="max-w-3xl mx-auto py-20 px-6 prose prose-invert">
        <h1 className="text-4xl font-black italic uppercase text-white mb-8">
          {t('impressumTitle')}
        </h1>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-slate-300">
          <h2 className="text-sky-500 uppercase text-sm tracking-widest mb-4">
            {t('tmgNotice')}
          </h2>
          <p>
            Nicolas Feltz<br />
            Rue des Aubépines<br />
            L-1145 Luxemburg
          </p>

          <h2 className="text-sky-500 uppercase text-sm tracking-widest mt-8 mb-4">
            {t('contactTitle')}
          </h2>
          <p>
            {t('phoneLabel')}: +352 (0) 621 393 424 {t('phoneHours')}<br />
            {t('emailLabel')}: regattamanagerverify@gmail.com
          </p>

          <h2 className="text-sky-500 uppercase text-sm tracking-widest mt-8 mb-4">
            {t('vatTitle')}
          </h2>
          <p>
            {t('vatText')}<br />
            DE123456789
          </p>

          <h2 className="text-sky-500 uppercase text-sm tracking-widest mt-8 mb-4">
            {t('euDisputeTitle')}
          </h2>
          <p>
            {t('euDisputeText')} 
            <a href="https://ec.europa.eu/consumers/odr/" className="text-sky-400 ml-1">
              https://ec.europa.eu/consumers/odr/
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}