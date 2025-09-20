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
