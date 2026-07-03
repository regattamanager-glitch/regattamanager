export type ActiveTab = "overview" | "vereine" | "federations" | "events";

export interface VereinRow {
  id: string;
  name: string | null;
  kuerzel: string | null;
  email: string | null;
  stripeAccountId: string | null;
  isApproved: boolean;
}

export interface FederationRow {
  id: string;
  name: string | null;
  kuerzel: string | null;
  email: string | null;
  region: string | null;
  isApproved: boolean;
}

export interface EventRow {
  id: string;
  name: string | null;
  datumVon: string | null;
  datumBis: string | null;
  revenue: number;
}

export interface AdminData {
  success: boolean;
  stats: { seglerCount: number; vereineCount: number; eventsCount: number; federationsCount?: number };
  vereine: VereinRow[];
  federations: FederationRow[];
  events: EventRow[];
  timeline: { date: string; zuwachs: number }[];
  revenueTimeline: { date: string; revenue: number }[];
  eventTimeline: { date: string; count: number }[];
}

// Einheitliches Chart-Styling (weiße Achsen/Labels auf dunklem Grund)
export const chartSx = {
  "& .MuiChartsAxis-line": { stroke: "white" },
  "& .MuiChartsAxis-tick": { stroke: "white" },
  "& .MuiChartsAxis-tickLabel": { fill: "white" },
} as const;

export function formatEUR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("de-DE");
}
