'use client';

import { useTranslations } from "next-intl";

export default function AGBPage() {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 font-sans pb-12">
      <div className="max-w-4xl mx-auto py-20 px-6 font-sans">
        <header className="mb-12">
          <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter">
            {t('agbTitleMain')} <span className="text-sky-500">{t('agbTitleHighlight')}</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest mt-2 text-xs">
            {t('standDate')}
          </p>
        </header>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          
          {/* Sektion 1 */}
          <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-2">
              <span className="text-sky-500 text-2xl">01.</span> {t('section1Title')}
            </h2>
            <p className="text-sm">
              {t('section1Text')}
            </p>
          </section>

          {/* Sektion 02 */}
          <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-2">
              <span className="text-sky-500 text-2xl">02.</span> {t('section2Title')}
            </h2>
            <p className="text-sm mb-4">
              {t('section2TextPrefix')} 
              <strong> {t('section2TextHighlight')}</strong>
            </p>
          </section>

          {/* Sektion 3 */}
          <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-2">
              <span className="text-sky-500 text-2xl">03.</span> {t('section3Title')}
            </h2>
            <p className="text-sm">
              {t('section3Text')}
            </p>
          </section>

          {/* Sektion 04 */}
          <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-2">
              <span className="text-sky-500 text-2xl">04.</span> {t('section4Title')}
            </h2>
            <p className="text-sm">
              {t('section4TextPart1')} 
              <strong> {t('section4TextHighlightContact')}</strong> 
              {t('section4TextPart2')}
              <strong> {t('section4TextHighlightFee')}</strong>
            </p>
          </section>

          {/* Sektion 5 */}
          <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h2 className="text-white font-black uppercase italic mb-4 flex items-center gap-2">
              <span className="text-sky-500 text-2xl">05.</span> {t('section5Title')}
            </h2>
            <div className="space-y-4 text-sm text-slate-300">
              <p>
                <strong>{t('section5_1_SubTitle')}</strong> {t('section5_1_Text')}
              </p>
              
              <p>
                <strong>{t('section5_2_SubTitle')}</strong> {t('section5_2_Text')}
              </p>

              <p className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl italic">
                <strong>{t('section5_3_SubTitle')}</strong> {t('section5_3_Text')}
              </p>
            </div>
          </section>

        </div>

        <footer className="mt-12 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black">
            {t('footerFramework')}
          </p>
        </footer>
      </div>
    </div>
  );
}