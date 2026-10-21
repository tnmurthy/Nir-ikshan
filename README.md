https://nir-ikshan.vercel.app/


## App structure (routes)

| URL | Page | Access |
|---|---|---|
| `/` | Home: quick actions + national water map | Public |
| `/report` | Lodge a water-body complaint | Public (mobile OTP inside form) |
| `/track`, `/track/:id` | Complaint status timeline (no personal data shown) | Public |
| `/citizen` | My complaints dashboard | Public / signed-in citizen |
| `/officers` | Officer directory | Public |
| `/console` | Officer workspace picker | Signed in |
| `/console/admin?tab=…` | State admin (tab kept in URL) | Signed in |
| `/console/nodal/:district` | Nodal officer (`vizianagaram`, `parvathipuram-manyam`, `visakhapatnam`) | Signed in |
| `/console/inspector`, `/console/engineer` | Field workspaces | Signed in |

Code map: `src/routes.tsx` (all routes) · `src/layouts/AppShell.tsx` (header, nav, footer) · `src/state/AppStateContext.tsx` (complaints + workflow) · `src/navigation/paths.ts` (URL helpers) · `src/pages/*` (route pages).

> The console sign-in still uses the demo OTP session. Replace with Supabase Auth before a real pilot.

```powershell
npm ci
npm run dev      # http://localhost:3000
npm run build
```
