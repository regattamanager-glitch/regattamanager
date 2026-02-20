'use client';

import { useTranslations } from "next-intl";

export default function DatenschutzPage() {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 font-sans pb-12">   
      <div className="max-w-3xl mx-auto py-20 px-6 prose prose-invert text-slate-300">
        <h1 className="text-4xl font-black italic uppercase text-white mb-8">
          {t('privacyTitle')}
        </h1>
        
        <h2 className="text-white">
          {t('privacySection1Title')}
        </h2>
        <p>
          {t('privacySection1Text')}
        </p>

        <h2 className="text-white mt-8">
          {t('privacySection2Title')}
        </h2>
        <p>
          {t('privacySection2Text')}
        </p>
        
        <h2 className="text-white mt-8">
          {t('privacySection3Title')}
        </h2>
        <p>
          {t('privacySection3Text')}
        </p>
      </div>
    </div>
  );
}