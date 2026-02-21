-- CreateTable
CREATE TABLE "Verein" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kuerzel" TEXT,
    "email" TEXT NOT NULL,
    "passwort" TEXT NOT NULL,
    "adresse" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "stripeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verein_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segler" (
    "id" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "geburtsjahr" TEXT NOT NULL,
    "nation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwort" TEXT NOT NULL,
    "worldSailingId" TEXT,
    "lizenzNummer" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "profilbild" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "seglerId" TEXT,
    "vereinId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SeglerVereine" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SeglerVereine_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SeglerFriends" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SeglerFriends_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verein_email_key" ON "Verein"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Segler_email_key" ON "Segler"("email");

-- CreateIndex
CREATE INDEX "_SeglerVereine_B_index" ON "_SeglerVereine"("B");

-- CreateIndex
CREATE INDEX "_SeglerFriends_B_index" ON "_SeglerFriends"("B");

-- AddForeignKey
ALTER TABLE "_SeglerVereine" ADD CONSTRAINT "_SeglerVereine_A_fkey" FOREIGN KEY ("A") REFERENCES "Segler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeglerVereine" ADD CONSTRAINT "_SeglerVereine_B_fkey" FOREIGN KEY ("B") REFERENCES "Verein"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeglerFriends" ADD CONSTRAINT "_SeglerFriends_A_fkey" FOREIGN KEY ("A") REFERENCES "Segler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeglerFriends" ADD CONSTRAINT "_SeglerFriends_B_fkey" FOREIGN KEY ("B") REFERENCES "Segler"("id") ON DELETE CASCADE ON UPDATE CASCADE;
