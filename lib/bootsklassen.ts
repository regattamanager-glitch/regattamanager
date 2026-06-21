/**
 * Zentrale Liste der Bootsklassen (zuvor hartcodiert in der Create-Seite).
 * Wird u.a. von der Yardstick-Verwaltung genutzt.
 */
export const BOOTSKLASSEN = [
  "ILCA", "ILCA 4", "ILCA 6", "ILCA 7", "Optimist", "420", "470", "49er", "49erFX", "29er",
  "Finn", "Europe", "RS:X", "iQFoil", "Nacra 17", "Nacra 15", "Vaurien", "FJ", "Fireball", "505",
  "Hobie Cat 16", "RS Aero", "OK Dinghy", "Topper", "Dragon", "Star", "Soling",
  "Flying Dutchman", "Tornado", "J70", "J80", "Snipe", "RS200", "RS400", "RS500",
  "RS700", "RS800", "RS100", "Moth", "Formula 18", "A-Cat", "Elliott 6m", "O-Jolle", "Firefly",
  "Sharpie", "Swallow", "Tempest", "Laser II", "International 14", "RS Feva", "RS Vision",
  "Yngling", "5,5m-R-Klasse", "6m-R-Klasse", "J24", "8m-R-Klasse", "Contender", "Splash", "Zoom8",
  "Sunfish", "B14", "Musto Skiff", "RS Tera", "O'pen BIC", "Sonstige",
] as const;

export type YardstickMethod = "time_on_time" | "time_on_distance";

export const YARDSTICK_METHODS: { value: YardstickMethod; label: string; hint: string }[] = [
  {
    value: "time_on_time",
    label: "Time-on-Time",
    hint: "Korrigierte Zeit = gesegelte Zeit × 100 / Yardstickzahl",
  },
  {
    value: "time_on_distance",
    label: "Time-on-Distance",
    hint: "Korrigierte Zeit = gesegelte Zeit − (Yardstickzahl × Distanz)",
  },
];
