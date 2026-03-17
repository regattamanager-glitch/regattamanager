'use client';

import { Link, useRouter, usePathname } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";

export default function Header({
  userType,
  userId, // Neue Prop hinzufügen
}: {
  userType?: "verein" | "segler"
  userId?: string // Typ definieren
}) {
  const t = useTranslations("Header");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Schließen des Dropdowns bei Klick außerhalb
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
  { code: 'el', label: 'Ελληνικά' }, 
  { code: 'hr', label: 'Hrvatski' }, 
  { code: 'pt', label: 'Português' }, 
  { code: 'tr', label: 'Türkçe' },    
];

  const currentLangLabel = languages.find(l => l.code === locale)?.label || "Language";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/accounts/logout", { method: "POST" });
      router.refresh(); // Wichtig: Validiert das Layout neu
      router.push("/");
    } catch (error) {
      console.error("Logout fehlgeschlagen", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as any });
    setIsLangOpen(false);
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-xl px-6 py-4">
      <div className="max-w-[1800px] mx-auto flex justify-between items-center">
        
        {/* BRANDING */}
        <Link href="/" className="flex items-center gap-1 group transition-all"> 
          <div className="flex flex-col border-l border-zinc-700 pl-3 h-10 justify-center text-left">
            <span className="text-xl group-hover:text-blue-500 font-black tracking-tighter text-white leading-tight transition-colors">
              Regatta Manager
            </span> 
            <span className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold leading-tight">
              Built by Sailors for Sailors
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          
          {/* Sprachwechsler */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700 hover:border-blue-500 transition-all text-sm font-bold text-zinc-200"
            >
              <span className="uppercase text-blue-400 font-black">{locale}</span>
              <span className="hidden xl:inline">{currentLangLabel}</span>
              <svg className={`w-4 h-4 text-zinc-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLangOpen && (
              <div 
                className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ zIndex: 9999 }} // Wir setzen einen extrem hohen Z-Index inline
              >
                <div className="p-2 grid gap-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
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

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {!userType ? (
              <div className="flex items-center gap-6">
                <Link href="/login" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                  {t('login') || "Anmelden"}
                </Link>
                <Link href="/register" className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-black hover:bg-blue-600 hover:text-white shadow-md transition-all active:scale-95">
                  {t('register') || "Konto erstellen"}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
                <Link
                    href={userType === "verein" ? `/dashboard/verein/${userId}` : `/dashboard/segler/${userId}`}
                    className="flex flex-col items-end group"
                  >
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-blue-400 transition-colors">
                    {userType === "verein" ? "Management" : "Athlet"}
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    Dashboard
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="ml-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all disabled:opacity-50"
                >
                  {isLoggingOut ? "..." : (t('logout') || "Logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}