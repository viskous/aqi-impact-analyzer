# AQI Impact Analyzer

Static HTML/CSS/JS plus optional local Node server. **GitHub Pages cannot run server-side code**, so pollution reports and the live map use a free **Supabase** database (or your own hosted API).

## Host on GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages**: Source = your default branch, folder `/ (root)`.
3. After the first deploy, open **Supabase** (free tier): [supabase.com](https://supabase.com) → New project.
4. In Supabase **SQL Editor**, run the script in `supabase_schema.sql` (creates `pollution_reports` and Row Level Security policies for public read/insert).
5. In the project **Settings → API**, copy:
   - **Project URL**
   - **`anon` `public` key**
6. Edit `js/site-config.js` in your repo and set:

   - `supabaseUrl` — your Project URL  
   - `supabaseAnonKey` — your anon public key  

7. Commit and push. Pollution reporting and the map will read/write Supabase from the static site.

**Security note:** The anon key is meant to be public; access is controlled with Row Level Security. For production you may want stricter policies, authentication, or rate limiting in Supabase.

### Alternative: Pages frontend + API elsewhere

If you prefer to keep using the Node app (`server.js`), deploy it to Render, Railway, Fly.io, etc., then in `js/site-config.js` set:

- `apiBase` — your API origin, e.g. `https://your-app.onrender.com`  
- Leave Supabase fields empty if the server handles all reads/writes.

The app will call `apiBase + "/api/reports"`.

## Run locally (Node + file database)

Requires Node.js and npm.

1. `npm install`
2. `npm start`
3. Open `http://localhost:3000`

With an empty Supabase config, the form and map use `/api/reports` on that server; reports are stored in `data/reports.json`.

## Pollution reporting flow

- **GitHub Pages + Supabase:** The browser geocodes the location (OpenStreetMap Nominatim), then saves latitude, longitude, and a server timestamp (and optional image) via Supabase REST.
- **Local Node:** Same UX; the server geocodes and appends to `data/reports.json`.
- **Map:** `pollution-map.html` loads markers from Supabase or the API and refreshes every 10 seconds.
- ## Team
This is a collaborative college project by:

| Name |
|------|
| Aditi Raj Sharma |
| Vishnu | 
| Aryan Kasaudhan | 
| Richa Singh | 
| Saurabh Singh Rajput | 
| Avinendra Kumar | 
