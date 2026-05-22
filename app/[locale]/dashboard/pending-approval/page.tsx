"use client";

import { useRouter } from "@/navigation";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950">
      <div className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[500px] text-center border border-white/10">
        
        {/* Icon oder Grafik */}
        <div className="text-6xl mb-2">⏳</div>
        
        <h1 className="text-3xl font-bold text-white">
          Verifizierung ausstehend
        </h1>
        
        <p className="text-white/80 leading-relaxed">
          Dein Account wurde erfolgreich registriert, wartet jedoch noch auf die 
          Freischaltung durch einen Administrator. 
          <br /><br />
          Bitte gedulde dich einen Moment. Sobald dein Account freigeschaltet wurde, 
          erhältst du Zugriff auf das Dashboard.
        </p>

        <button 
          onClick={() => router.replace("/")}
          className="bg-blue-700/70 hover:bg-blue-800/70 text-white font-bold py-4 rounded-xl transition-colors shadow-lg mt-4"
        >
          Zurück zum Login
        </button>
      </div>
    </div>
  );
}