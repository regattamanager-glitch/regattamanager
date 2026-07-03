export type Extra = { name: string; price: number };
export type EventDocument = { id: string; name: string; url: string };
export type Account = { id: string; name: string; email: string; adresse?: string };
export type GebuehrInfo = {
  limit: number | null;
  spaet: number;
  gender: string;
  maxAge: number | null;
  minAge: number | null;
  normal: number;
};

export type RegattaEvent = {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  land: string;
  location: string;
  vereinId: string;
  alleKlassen: boolean;
  bootsklassen: string[];
  gebuehrNormal: number;
  gebuehrSpaet: number;
  extras: Extra[];
  documents: EventDocument[];
  anmeldungVon: string;
  anmeldungBis: string;
  anmeldungsZeitraum: {
    von: string;
    bis: string;
  };
  latitude?: number;
  longitude?: number;
  notizen?: string;
  gebuehren_pro_klasse: Record<string, GebuehrInfo>;
  segler?: Record<string, SeglerAnmeldung[]>;
};

export type Meldung = {
  id: string;
  skipperName: string;
  skipperCountry: string;
  sailCountry: string;
  sailNumber: string | number;
  bootName?: string;
  bezahlt?: boolean;
  bootsklasse?: string;
  crew?: string;
};

export type Person = {
  seglerId: string;
  name: string;
  countryCode: string;
};

export type BootInfo = {
  bootName?: string;
  segelnummer: string | number;
  countryCode: string;
  bootsklasse?: string;
};

export type SeglerAnmeldung = {
  skipper: Person;
  boot: BootInfo;
  bezahlt?: boolean;
  createdAt: string;
};

// resultsData[eventId][klasse][seglerId] = Liste der Wettfahrt-Ergebnisse
export type ResultsData = Record<string, Record<string, Record<string, string[]>>>;

export type Friend = {
  id: string;
  vorname?: string;
  nachname?: string;
  name?: string;
};

// World Sailing Sail Codes → ISO 3166-1 Alpha-2 (für flagcdn.com)
export const sailCountryToFlag: Record<string, string> = {
  ABD: "um", // ggf. wenn Sonderfälle im Backend auftauchen

  ALG: "dz", ASA: "as", AND: "ad", ANG: "ao", ANT: "ag",
  ARG: "ar", ARM: "am", ARU: "aw", AUS: "au", AUT: "at",
  AZE: "az", BAH: "bs", BRN: "bh", BAR: "bb", BLR: "by",
  BEL: "be", BIZ: "bz", BER: "bm", BHR: "bh", VIN: "vc",
  BOL: "bo", BOT: "bw", BRA: "br", BRB: "bb", BUL: "bg",
  CAN: "ca", CAY: "ky", CHI: "cl", CHN: "cn", COL: "co",
  COK: "ck", CRO: "hr", CUB: "cu", CYP: "cy", CZE: "cz",
  DEN: "dk", DJI: "dj", DOM: "do", ECU: "ec", EGY: "eg",
  ESA: "sv", EST: "ee", ESP: "es", FIJ: "fj", FIN: "fi", FRA: "fr",
  GEO: "ge", GER: "de", GBR: "gb", GRE: "gr", GRN: "gd",
  GUM: "gu", GUA: "gt", HKG: "hk", HUN: "hu", ISL: "is",
  IND: "in", INA: "id", IRL: "ie", ISR: "il", ITA: "it",
  JAM: "jm", JPN: "jp", KAZ: "kz", KEN: "ke", KOR: "kr",
  PRK: "kp", KOS: "xk", KUW: "kw", KGZ: "kg", LAT: "lv",
  LIB: "lb", LBA: "ly", LIE: "li", LTU: "lt", LUX: "lu",
  MAD: "mg", MAS: "my", MLT: "mt", MRI: "mu", MEX: "mx",
  MDA: "md", MON: "mc", MNE: "me", MOZ: "mz", MYA: "mm",
  NAM: "na", NCA: "ni", NED: "nl", NGR: "ng", NOR: "no",
  OMA: "om", PAN: "pa", PER: "pe", PHI: "ph", POL: "pl",
  POR: "pt", QAT: "qa", RSA: "za", SRI: "lk", SKN: "kn",
  SUD: "sd", SWE: "se", SUI: "ch", TAN: "tz", TAH: "pm",
  TJK: "tj", TKA: "to", TUN: "tn", TUR: "tr", TCA: "tc",
  UAE: "ae", UKR: "ua", URU: "uy", USA: "us", USV: "vi",
  VEN: "ve", VIE: "vn", ZIM: "zw",
};

export function flagUrl(sailCode: string | undefined): string {
  const iso = sailCode ? sailCountryToFlag[sailCode]?.toLowerCase() || "un" : "un";
  return `https://flagcdn.com/w20/${iso}.png`;
}
