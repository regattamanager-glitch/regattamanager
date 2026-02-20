"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function RegisterSelection() {
  const t = useTranslations("Auth");

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      {/* Hintergrund wie beim Login */}
      <div className="flex flex-col gap-12 bg-blue-900/30 backdrop-blur-md p-16 rounded-3xl shadow-xl w-[650px] sm:w-[800px]">
        <h1 className="text-4xl font-bold text-white text-center">
          {t('selectionTitle')}
        </h1>

        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {/* Segler Account */}
          <Link href="/register/segler">
            <div className="cursor-pointer rounded-2xl bg-blue-600/90 hover:bg-blue-700/80 shadow-xl p-10 w-full md:w-72 text-center transition transform hover:scale-105">
              <h2 className="text-3xl font-bold text-white mb-3">
                {t('seglerAccountTitle')}
              </h2>
              <p className="text-white/90 text-lg">
                {t('seglerAccountDescription')}
              </p>
            </div>
          </Link> 

          {/* Vereins Account */}
          <Link href="/register/verein">
            <div className="cursor-pointer rounded-2xl bg-blue-700/40 hover:bg-blue-900/80 p-10 w-full md:w-72 text-center transition transform hover:scale-105">
              <h2 className="text-3xl font-bold text-white mb-3">
                {t('vereinAccountTitle')}
              </h2>
              <p className="text-white/80 text-lg">
                {t('vereinAccountDescription')}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}