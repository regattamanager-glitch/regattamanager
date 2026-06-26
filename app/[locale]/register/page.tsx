"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function RegisterSelection() {
  const t = useTranslations("Auth");

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      {/* Hintergrund wie beim Login – Breite an drei Kacheln angepasst */}
      <div className="flex flex-col gap-12 bg-blue-900/30 backdrop-blur-md p-10 sm:p-14 rounded-3xl shadow-xl w-[90vw] max-w-[960px]">
        <h1 className="text-4xl font-bold text-white text-center">
          {t('selectionTitle')}
        </h1>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch">
          {/* Segler Account */}
          <Link href="/register/segler">
            <div className="cursor-pointer rounded-2xl bg-blue-600/90 hover:bg-blue-700/80 shadow-xl p-10 w-full md:w-64 text-center transition transform hover:scale-105">
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
            <div className="cursor-pointer rounded-2xl bg-blue-700/40 hover:bg-blue-900/80 p-10 w-full md:w-64 text-center transition transform hover:scale-105">
              <h2 className="text-3xl font-bold text-white mb-3">
                {t('vereinAccountTitle')}
              </h2>
              <p className="text-white/80 text-lg">
                {t('vereinAccountDescription')}
              </p>
            </div>
          </Link>

          {/* Föderations Account */}
          <Link href="/register/federation">
            <div className="cursor-pointer rounded-2xl bg-teal-700/40 hover:bg-teal-900/80 p-10 w-full md:w-64 text-center transition transform hover:scale-105">
              <h2 className="text-3xl font-bold text-white mb-3">
                {t('federationAccountTitle')}
              </h2>
              <p className="text-white/80 text-lg">
                {t('federationAccountDescription')}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}