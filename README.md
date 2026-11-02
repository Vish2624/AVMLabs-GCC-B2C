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
assets/           logo and category icons
support.js icon.js image-slot.js .image-slots.state.json   website runtime (keep beside the .dc.html)
```

## Commands

```
npm install        install dependencies
npm run dev        local server: http://localhost:3000, admin at /admin/
npm run build      rebuild the site file and copy static files to public/
npm run check      confirm the site file matches src/
```

Edit the website in `src/`, then `npm run build`. The Claude Design runtime only reads
markup and logic from inside the single `.dc.html` file, so the build combines every part.

## Website

`src/index.html` is the page skeleton; it shows which page or overlay appears when.
Parts live in `src/components/`, `src/pages/` and `src/reels/`; styles in `src/styles/`;
editor settings (WhatsApp numbers, addresses, fees) in `src/config/settings.json`.
`src/logic/*.js` are pieces of one `Component` class, in order, not standalone modules.

On load the site fetches `/api/profiles`. If that fails it keeps the profiles built into
`src/logic/01-data.js`, so it never shows an empty page.

## Admin

`/admin/` signs in with one shared password and manages health profiles: details, look,
and sub-profiles made of tests picked from `src/data/tests.json`. The website picks up
changes within a minute (the public API is cached at Vercel's edge for 60 seconds).

| Route | |
|---|---|
| `GET /api/profiles` | published profiles for the website |
| `GET/POST/DELETE /api/admin/session` | session status, log in, log out |
| `GET /api/admin/catalog` | tests, categories, icons, colours |
| `GET/POST /api/admin/profiles` | list all, create |
| `PUT/DELETE /api/admin/profiles/:id` | update, delete |

## Setup

1. Create a Supabase project. In its SQL Editor run `supabase/migrations/0001_profiles.sql`,
   then `supabase/seed.sql`.
2. In Vercel → Project Settings → Environment Variables, add the values listed in
   `.env.example` (SESSION_SECRET is optional), then redeploy. Connecting Supabase
   through Vercel → Storage adds the two Supabase values automatically.
3. For local development, copy `.env.example` to `.env` and fill it in.
