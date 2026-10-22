import { readFile, writeFile, mkdir } from "node:fs/promises";
const root = new URL("./", import.meta.url);
const extra = JSON.parse(await readFile(new URL(process.argv[2] || 'expanded-restaurants.json', root), 'utf8'));
const locations = Array.isArray(extra) ? extra : extra.restaurants;
await mkdir(new URL('district-evidence/', root), { recursive: true });
for (const restaurant of locations) {
  const key = restaurant.slug || restaurant.key;
  const address = restaurant.address;
  if (!address) throw new Error(`Missing published address: ${key}`);
  const sourceUrl = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?' +
    new URLSearchParams({ address, benchmark: 'Public_AR_Current', vintage: 'ACS2025_Current', format: 'json' });
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Census ${response.status}: ${key}`);
  const body = await response.json();
  const matches = body.result.addressMatches;
  const congressional = matches[0]?.geographies['119th Congressional Districts']?.[0];
  await writeFile(new URL(`district-evidence/${key}.json`, root),
    JSON.stringify({ sourceUrl, reviewedAt: '2026-10-21', response: body }, null, 2));
  console.log(key, congressional ? `FL-${congressional.BASENAME}` : 'NO MATCH — no district claimed');
}
