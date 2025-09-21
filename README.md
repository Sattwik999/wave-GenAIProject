# WAVE (Supabase + Gemini) — Google-style SPA

All features: Chat, Mood, Pulse, Journal, Crisis, AR, Settings.
Gmail-style headbar with Google Sign-In, profile email, Sign out & Switch account.

## Quick Run
Backend:
```
cd wave-server
cp .env.example .env  # fill SUPABASE_URL, SUPABASE_SERVICE_ROLE, GEMINI_API_KEY
npm install
npm run dev
```

Frontend:
```
cd wave-client
cp .env.example .env  # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE=http://localhost:8787
npm install
npm run dev
```

Supabase: run `supabase_schema.sql` in SQL editor. Enable Google provider.

## Deploy (quickest: Render Blueprint)

This repo includes `render.yaml` for one-click deploy of both services:

1) Push this repo to GitHub (public or private).
2) Go to Render -> New + -> Blueprint -> connect the repo.
3) Render will detect `render.yaml` and create:
	- A Web Service: `wave-server` (Node Express)
	- A Static Site: `wave-client` (Vite React)
4) In Render dashboard, set the environment variables:
	- wave-server: SUPABASE_URL, SUPABASE_SERVICE_ROLE, GEMINI_API_KEY
	- wave-client: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
	  (VITE_API_BASE will auto-link to the server URL via the blueprint)
5) Deploy. After `wave-server` is live, `wave-client` will build using VITE_API_BASE pointing to it.

Notes:
- You can add a custom domain for each service from Render.
- If you change env vars, redeploy the affected service.

## Alternative: Vercel (client) + Render (server)

If you prefer Vercel for the client UI:

Server on Render:
1) Create a new Web Service from `wave-server` folder.
2) Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, GEMINI_API_KEY.
3) Deploy and note the public URL (e.g., https://wave-server-xxxx.onrender.com).

Client on Vercel:
1) Import the repo in Vercel, select `wave-client` as the project root.
2) Set env vars:
	- VITE_SUPABASE_URL
	- VITE_SUPABASE_ANON_KEY
	- VITE_API_BASE=https://wave-server-xxxx.onrender.com
3) Optionally, keep `vercel.json` (already present) if you plan to use a custom API domain; otherwise it's safe to leave as is.
4) Deploy.

## Netlify (client) + Server (Render or other)

This repo includes `netlify.toml` to build and serve the client from Netlify with SPA routing.

Server (choose one):
- Render: Deploy `wave-server` as described above and copy its public URL
- Any Node host (Railway, Fly.io, etc.): ensure Express is reachable over HTTPS

Client on Netlify:
1) In Netlify, New site from Git → pick this repo
2) Build settings (auto-detected from `netlify.toml`):
	- Base directory: `wave-client`
	- Build command: `npm install && npm run build`
	- Publish directory: `dist`
3) Environment variables:
	- VITE_SUPABASE_URL
	- VITE_SUPABASE_ANON_KEY
	- VITE_API_BASE = https://YOUR-SERVER-URL (e.g., your Render web service)
4) Deploy. Netlify will run the Vite build and serve the `dist/` output with correct SPA redirects.

Notes:
- If you prefer not to set `VITE_API_BASE`, you can proxy `/api` in `netlify.toml` by uncommenting the redirects block and pointing it to your server URL.
- Ensure you never expose SUPABASE_SERVICE_ROLE on Netlify (client-side). That key must remain server-only.

## Environment Variables

- `wave-server/.env.example` and `wave-client/.env.example` list the required keys.
- Never expose SUPABASE_SERVICE_ROLE in the client; it belongs on the server only.

## Production checklist

- Supabase: run `supabase_schema.sql`, enable Google provider, set redirect URLs.
- Secrets set in hosts (Render/Vercel) as described above.
- Optional: Add custom domains and HTTPS.
