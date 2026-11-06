// Seed public.observations with G7 inflation and unemployment from the World Bank API.
// Run: npm run seed   (reads .env.local; needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY)
// Safe to re-run: rows are upserted on (country, indicator, year).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (run with --env-file=.env.local)");
  process.exit(1);
}

const COUNTRIES = { CAN: "Canada", FRA: "France", DEU: "Germany", ITA: "Italy", JPN: "Japan", GBR: "United Kingdom", USA: "United States" };
const INDICATORS = { "FP.CPI.TOTL.ZG": "inflation", "SL.UEM.TOTL.ZS": "unemployment" };
const START_YEAR = 2010;
const END_YEAR = new Date().getFullYear();

async function fetchIndicator(code) {
  const url = `https://api.worldbank.org/v2/country/${Object.keys(COUNTRIES).join(";")}/indicator/${code}` +
    `?date=${START_YEAR}:${END_YEAR}&format=json&per_page=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank ${code}: HTTP ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body) || !Array.isArray(body[1])) throw new Error(`World Bank ${code}: unexpected response ${JSON.stringify(body).slice(0, 200)}`);
  return body[1]
    .filter((d) => d.value !== null) // skip years not yet published
    .map((d) => ({
      country: COUNTRIES[d.countryiso3code],
      indicator: INDICATORS[code],
      year: Number(d.date),
      value: d.value,
    }));
}

async function upsert(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/observations?on_conflict=country,indicator,year`, {
    method: "POST",
    headers: {
      apikey: SECRET_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert: HTTP ${res.status} ${await res.text()}`);
}

const rows = (await Promise.all(Object.keys(INDICATORS).map(fetchIndicator))).flat();
console.log(`Downloaded ${rows.length} observations (${START_YEAR}-${END_YEAR}).`);
await upsert(rows);
console.log("Upserted into public.observations.");
