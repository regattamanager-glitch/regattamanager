import './globals.css'
import 'leaflet/dist/leaflet.css'
import BackgroundWrapper from '@/components/BackgroundWrapper'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

// next-intl Imports
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/navigation';

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
  params: Promise<{ locale: string }> // In neueren Next-Versionen ist params ein Promise
}) {
  // 1. Locale aus params holen und validieren
  const { locale } = await params;

  // Nutze die Locales aus deiner zentralen navigation.ts
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // 2. Übersetzungen laden
  const messages = await getMessages();

  // 3. Bestehende Session-Logik
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value
  let userType: "verein" | "segler" | undefined = undefined

  if (sessionId) {
    const sessionsFile = path.join(process.cwd(), "app/api/accounts/sessions.json")
    const accountsFile = path.join(process.cwd(), "app/api/accounts/accounts.json")

    if (fs.existsSync(sessionsFile) && fs.existsSync(accountsFile)) {
      const sessions: Session[] = JSON.parse(fs.readFileSync(sessionsFile, "utf-8"))
      const session = sessions.find((s) => s.id === sessionId && s.expires > Date.now())

      if (session) {
        const accounts: Account[] = JSON.parse(fs.readFileSync(accountsFile, "utf-8"))
        const user = accounts.find((u) => u.id === session.userId)
        if (user) {
          userType = user.type
        }
      }
    }
  }

  return (
    <html lang={locale}>
      <body className="relative min-h-screen overflow-x-hidden flex flex-col">
        {/* Den Provider um den gesamten Inhalt legen */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BackgroundWrapper />

          <div className="relative z-10 flex-grow">
            <Header userType={userType} />
            <main className="px-6 py-8 text-white">{children}</main>
          </div>

          <div className="relative z-10">
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}