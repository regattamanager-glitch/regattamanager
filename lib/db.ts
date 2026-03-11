import { neon } from '@neondatabase/serverless';

// Wir exportieren eine einfache Funktion für SQL-Abfragen
const sql = neon(process.env.DATABASE_URL!);

export default sql;