"use client";

import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

export default function PendingApprovalPage() {
  const t = useTranslations("PendingApproval");
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-6 ">
      <div className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[500px] text-center border border-white/10">
        
        <div className="text-6xl mb-2">⏳</div>
        
        <h1 className="text-3xl font-bold text-white">
          {t("title")}
        </h1>
        
        <p className="text-white/80 leading-relaxed">
          {t("description")}
        </p>

        <button 
          onClick={() => router.replace("/login")}
          className="bg-blue-700/70 hover:bg-blue-800/70 text-white font-bold py-4 rounded-xl transition-colors shadow-lg mt-4"
        >
          {t("backToLogin")}
        </button>
      </div>
    </div>
  );
}