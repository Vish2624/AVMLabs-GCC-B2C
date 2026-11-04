// Centres: the address, Google Maps link and WhatsApp number of each AVM Labs centre, by country.
// The website shows the centres of the visitor's country and sends WhatsApp messages to their number.
// The admin saves the whole list at once. Until the database is up to date (server/db.js), the built-in
// list (src/data/centres.json) is served and saving is refused.
import { z } from 'zod';
import { COUNTRIES, STATIC_CENTRES } from './catalog.js';
import { db, dbReady, requireDb, unwrap } from './db.js';
import { HttpError } from './http.js';

const text = (max) => z.string().trim().max(max);

const centreSchema = z.object({
  country: z.enum(
    COUNTRIES.map((c) => c.code),
    { message: 'Pick a country' },
  ),
  city: text(60).min(1, 'Enter the city of every centre'),
  address: text(200).min(1, 'Enter the address of every centre'),
  maps: text(300)
    .min(1, 'Enter the Google Maps link of every centre')
    .refine((u) => /^https:\/\/[^\s/]+\.[^\s/]+\/\S*$/.test(u), 'Google Maps links start with https://'),
  // Digits with the country code, e.g. 971501304708; spaces, dashes and + are dropped.
  whatsapp: z
    .string()
    .transform((s) => s.replace(/[\s+\-()]/g, ''))
    .pipe(z.string().regex(/^\d{8,15}$/, 'WhatsApp numbers are 8–15 digits with the country code, e.g. 971501304708')),
});

export const centresSchema = z
  .array(centreSchema)
  .min(1, 'Add at least one centre')
  .max(30)
  .superRefine((list, ctx) => {
    const missing = COUNTRIES.find((c) => !list.some((x) => x.country === c.code));
    if (missing) ctx.addIssue({ code: 'custom', message: `Add at least one centre in ${missing.name}` });
  });

export function parseCentres(body) {
  const result = centresSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new HttpError(422, issues[0].message, issues);
  }
  return result.data;
}

const devStore = () => globalThis.AVM_DEV_STORE;
const fromRow = (r) => ({
  country: r.country,
  city: r.city,
  address: r.address,
  maps: r.maps_url,
  whatsapp: r.whatsapp,
});

export async function listCentres() {
  if (devStore()) return devStore().listCentres();
  if (!(await dbReady())) return STATIC_CENTRES.map((c) => ({ ...c }));
  return unwrap(await db().from('centres').select('*').order('sort_order')).map(fromRow);
}

// Replaces every centre, in the order given.
export async function saveCentres(list) {
  if (devStore()) return devStore().saveCentres(list);
  await requireDb();
  unwrap(
    await db().rpc('save_centres', {
      payload: list.map((c, i) => ({ ...c, maps_url: c.maps, sort_order: i })),
    }),
  );
}
