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
editor settings (WhatsApp numbers, addresses, fees) in `src/config/settings.json`.
`src/logic/*.js` are pieces of one `Component` class, in order, not standalone modules.

Each page has its own path (`/tests`, `/tests/<id>`, `/profiles`, `/profiles/<id>` for a profile's
reel, `/about`, `/cart`); `vercel.json` and `scripts/dev.js` serve the site file on them, and old
`#tests`-style links are moved to their path on load. `npm run build` writes `public/sitemap.xml`
from `src/data/tests.json` and the built-in profiles.

On load the site fetches `/api/profiles`. If that fails it keeps the profiles built into
`src/logic/01-data.js`, so it never shows an empty page.

## Admin

`/admin/` signs in with one shared password and manages health profiles: details, look,
sub-profiles made of tests picked from `src/data/tests.json`, and the reel text ("Why take
this profile" and "Ideal for"). The website picks up
changes within a minute (the public API is cached at Vercel's edge for 60 seconds).

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

## Setup

1. Create a Supabase project. In its SQL Editor run `supabase/migrations/0001_profiles.sql`,
   then `supabase/migrations/0002_sub_profile_library.sql`, then `supabase/migrations/0003_tests.sql`,
   then `supabase/seed.sql`.
   An existing project only needs `0002_sub_profile_library.sql`: it moves each profile's
   sub-profiles into the shared library. Until it runs, the website keeps working and the
   admin shows a message asking for it. `0003_tests.sql` moves the tests into the database so
   they can be managed in the admin; until it runs, the built-in `src/data/tests.json` is used.
   After `seed.sql`, run `0004_country_prices.sql` and then `0005_profile_benefits.sql`. Until
   `0005` runs, the website keeps its built-in reel text and the admin refuses to save profiles,
   with a message asking for it.
2. In Vercel → Project Settings → Environment Variables, add the values listed in
   `.env.example` (SESSION_SECRET is optional), then redeploy. Connecting Supabase
   through Vercel → Storage adds the two Supabase values automatically.
3. For local development, copy `.env.example` to `.env` and fill it in.
