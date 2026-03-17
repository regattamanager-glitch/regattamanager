import './globals.css'
import 'leaflet/dist/leaflet.css'
import BackgroundWrapper from '@/components/BackgroundWrapper'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { neon } from '@neondatabase/serverless';

import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

// next-intl Imports
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Session = {
  id: string
  userId: string
  expires: number
}

type Account = { 
  id: string
  type: "verein" | "segler"
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const messages = await getMessages();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  // Variablen außerhalb des Blocks definieren, damit sie unten beim <Header /> verfügbar sind
  let userType: "verein" | "segler" | undefined = undefined;
  let userId: string | undefined = undefined;

  if (sessionId) {
    const sql = neon(process.env.DATABASE_URL!);
    
    try {
      const currentTimeInSeconds = Date.now() / 1000;

      // Wir fügen "v.id" zur Abfrage hinzu, damit wir die userId erhalten
      const result = await sql`
        SELECT v.id as "userId", 'verein' as type
        FROM "Verein" v
        JOIN "Session" s ON v.id = s."userId"
        WHERE s.id = ${sessionId} AND s.expires > to_timestamp(${currentTimeInSeconds})
        
        UNION ALL
        
        SELECT v.id as "userId", 'segler' as type
        FROM "Segler" v
        JOIN "Session" s ON v.id = s."userId"
        WHERE s.id = ${sessionId} AND s.expires > to_timestamp(${currentTimeInSeconds})
        
        LIMIT 1
      `;

      if (result.length > 0) {
        userType = result[0].type as "verein" | "segler";
        userId = result[0].userId; // Die ID aus der DB zuweisen
      }
    } catch (error) {
      console.error("Datenbank-Fehler im Layout:", error);
    }
  }

  return (
    <html lang={locale}>
      <body className="relative min-h-screen overflow-x-hidden flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BackgroundWrapper />
          <div className="relative z-10 flex-grow">
            {/* Jetzt sind beide Variablen hier bekannt */}
            <Header userType={userType} userId={userId} />
            <main className="px-6 py-8 text-white">{children}</main>
          </div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}