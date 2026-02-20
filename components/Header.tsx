'use client';

import { Link, useRouter, usePathname } from "@/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";

export default function Header({
  userType,
}: {
  userType?: "verein" | "segler"
}) {
  const t = useTranslations("Header");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'es', label: 'Español' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'el', label: 'Elliniká' },
    { code: 'hr', label: 'Hrvatski' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'pt', label: 'Português' },
  ];

  const currentLangLabel = languages.find(l => l.code === locale)?.label || "Language";

  const handleLogoClick = async () => {
    if (userType) {
      await fetch("/api/accounts/logout", { method: "POST" });
      router.refresh();
    }
    router.push("/");
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as any });
    setIsLangOpen(false);
  };

  return (
    // Reduziert: py-8 -> py-4 (Header wird flacher)
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-xl px-6 py-4">
      {/* Geändert: max-w-[1600px] -> max-w-[1800px] oder 100% (Objekte wandern weiter nach außen) */}
      <div className="max-w-[1800px] mx-auto flex justify-between items-center">
        
        {/* LOGO & BRANDING */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-1 group transition-all"
        > 
          {/* Reduziert: h-14 -> h-10; text-3xl -> text-xl (Schriftzug dezenter) */}
          <div className="hidden lg:flex flex-col border-l border-zinc-700 pl-3 h-10 justify-center text-left">
            <span className="text-xl group-hover:scale-[1.05] group-hover:text-blue-500 font-black tracking-tighter text-white leading-tight">
              Regatta Manager
            </span> 
            <span className="text-[10px] uppercase tracking-[0.3em] group-hover:scale-[1.025] text-blue-500 font-bold leading-tight">
              Built by Sailors for Sailors
            </span>
          </div>
        </button>

        <div className="flex items-center gap-6">
          
          {/* Sprachwechsler - Kompakter gemacht */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700 hover:border-blue-500 transition-all text-sm font-bold text-zinc-200"
            >
              <span className="uppercase text-blue-400 font-black">{locale}</span>
              <span className="hidden xl:inline">{currentLangLabel}</span>
              <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 grid gap-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        locale === lang.code 
                        ? "bg-blue-600 text-white" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Kleiner und feiner */}
          <div className="flex items-center gap-6">
            {!userType ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  {t('login') || "Anmelden"}
                </Link>
            
                <Link
                  href="/register"
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-black 
                             hover:bg-blue-600 hover:text-white shadow-md
                             hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                >
                  {t('register') || "Konto erstellen"}
                </Link>
              </>
            ) : (
              <div className="flex items-center pl-6 border-l border-zinc-800 h-8">
                <span className="text-zinc-500 text-sm font-medium">Dashboard</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}