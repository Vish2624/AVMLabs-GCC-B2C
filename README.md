# AVM Labs Website

Public website, admin panel and API, deployed on Vercel with data in Supabase.

```
src/              website source, assembled into "AVM Labs Website.dc.html" by build.js
  data/tests.json   test catalogue, shared by the website and the API
admin/            admin panel (static HTML, CSS and ES modules, no build step)
api/              Vercel serverless functions
server/           code shared by the API: auth, database, validation
supabase/         database schema (migrations/) and starting data (seed.sql)
scripts/          dev server and build helpers
tests/            API tests (node:test)
.github/          CI workflow
assets/           logo and category icons
support.js icon.js image-slot.js .image-slots.state.json   website runtime (keep beside the .dc.html)
```

## Development

Requires Node 22 (see `.nvmrc`). VS Code will suggest the ESLint, Prettier and EditorConfig extensions.

```
npm install            install dependencies
npm run dev            local server: http://localhost:3000, admin at /admin/
npm run build          rebuild the site file and copy static files to public/
npm run check          confirm the site file matches src/
npm test               run the API tests (tests/)
npm run lint           ESLint        (npm run lint:fix to auto-fix)
npm run format         Prettier      (npm run format:check to only check)
npm run verify         lint + format check + tests + build check, as CI runs on every push
```

`src/` and the runtime scripts are excluded from linting and formatting: build.js assembles them
byte-for-byte into the site file, so reformatting them would change the site.

Edit the website in `src/`, then `npm run build`. The Claude Design runtime only reads
markup and logic from inside the single `.dc.html` file, so the build combines every part.

## Website

`src/index.html` is the page skeleton; it shows which page or overlay appears when.
Parts live in `src/components/`, `src/pages/` and `src/reels/`; styles in `src/styles/`;
editor settings (location gate, preview country) in `src/config/settings.json`.
`src/logic/*.js` are pieces of one `Component` class, in order, not standalone modules.

Each page has its own path (`/tests`, `/tests/<id>`, `/profiles`, `/profiles/<id>` for a profile's
reel, `/about`, `/cart`); `vercel.json` and `scripts/dev.js` serve the site file on them, and old
`#tests`-style links are moved to their path on load. `npm run build` writes `public/sitemap.xml`
from `src/data/tests.json` and the built-in profiles.

On load the site fetches `/api/tests`, `/api/profiles` and `/api/centres`. If that fails it keeps the
lists built in from `src/data/`, so it never shows an empty page. Centres (address, Google Maps link and
WhatsApp number per city) are edited in the admin under Centres; the site shows the visitor's country's
centres and sends WhatsApp messages to the centre in their city, else the country's first one.

## Admin

`/admin/` signs in with one shared password and manages health profiles: details, look,
sub-profiles made of tests picked from `src/data/tests.json`, and the reel text ("Why take
this profile" and "Ideal for"). The website picks up
changes within about 5 minutes: the public API is cached at Vercel's edge for 5 minutes and
refreshed in the background, so visitors never wait for it. The page shows the built-in tests
and profiles straight away and only re-renders if the API's differ.

| Route | |
|---|---|
| `GET /api/profiles` | published profiles for the website |
| `GET/POST/DELETE /api/admin/session` | session status, log in, log out |
| `GET /api/admin/catalog` | tests, categories, icons, colours |
| `GET/POST /api/admin/profiles` | list all, create |
| `PUT/DELETE /api/admin/profiles/:id` | update, delete |
| `GET/POST /api/admin/subprofiles` | list reusable sub-profiles (with the profiles using each), create |
| `PUT/DELETE /api/admin/subprofiles/:id` | update, delete (refused while a profile uses it) |
| `GET/POST /api/admin/tests` | list all tests (including hidden), create |
| `PUT/DELETE /api/admin/tests/:id` | update, delete (refused while a sub-profile or profile uses it) |
| `GET /api/tests` | published tests for the website |
| `GET/PUT /api/centres` | centres for the website; replace the list (admin only) |

## Setup

1. Create a Supabase project. In its SQL Editor run, in order: `supabase/migrations/0001_profiles.sql`,
   `0002_sub_profile_library.sql`, `0003_tests.sql`, then `supabase/seed.sql`, then
   `0004_country_prices.sql`, `0005_profile_benefits.sql` and `0006_b2c_profiles.sql`. An existing
   project runs the ones it hasn't yet. `0006` replaces every profile with the 27 from the B2C rates
   sheet (`src/data/profiles.json`) and adds each test's and profile's lab code and short name, kept
   for the lab and shown only in the admin (the public API and the website leave them out). It also
   adds parameter groups to tests (CBC, Complete Urine Analysis and Urinogram are filled in), folds
   the old calculated parameters into the ordinary list, and adds the `centres` table.
   Until `0006` has run, the API serves the built-in tests and profiles (`src/data/`) and the admin
   shows them but refuses to save, with a message asking for it.
2. In Vercel → Project Settings → Environment Variables, add the values listed in
   `.env.example` (SESSION_SECRET is optional), then redeploy. Connecting Supabase
   through Vercel → Storage adds the two Supabase values automatically.
3. For local development, copy `.env.example` to `.env` and fill it in.
