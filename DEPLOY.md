# Deploying: Vercel (frontend) + Render (backend) + Supabase (Postgres)

This repo is set up for exactly this split. Order matters — Supabase first, then
Render (needs the database), then Vercel (needs the backend's URL).

## 1. Supabase — database

1. Create a project at supabase.com (free tier is fine).
2. Project Settings → Database → **Connection string** → copy the **Session pooler**
   URI (port `6543`, not the direct `5432` one — Render's free tier works more
   reliably through the pooler). It looks like:
   `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres`
3. Translate that into the three values the backend needs:
   - `DATABASE_URL` = `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require`
   - `DATABASE_USERNAME` = `postgres.xxxxx` (the full string before the `@`)
   - `DATABASE_PASSWORD` = the database password you set when creating the project
4. Nothing to run manually — `spring.jpa.hibernate.ddl-auto=update` creates every
   table automatically on first boot.

## 2. Render — backend

1. Push this repo to GitHub (see below).
2. New + → **Blueprint**, point it at the repo. Render reads `render.yaml` at the
   repo root and creates the service (Root Directory `backend/spring-boot-app`,
   Docker build) automatically. If you'd rather set it up by hand: New + → Web
   Service → same repo → Root Directory `backend/spring-boot-app` → Runtime: Docker.
3. Fill in the environment variables Render prompts for (from the Blueprint) or
   add these manually under the service's Environment tab:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | from Supabase, step 1 |
   | `DATABASE_USERNAME` | from Supabase, step 1 |
   | `DATABASE_PASSWORD` | from Supabase, step 1 |
   | `DATABASE_DRIVER` | `org.postgresql.Driver` |
   | `DATABASE_DIALECT` | `org.hibernate.dialect.PostgreSQLDialect` |
   | `FRONTEND_URL` | your Vercel URL (step 3.4) — used in emailed links |
   | `CORS_EXTRA_ORIGINS` | same Vercel URL |
   | `MAIL_USERNAME` | your sending Gmail address |
   | `MAIL_PASSWORD` | a Gmail **app password** (not the account password) |
   | `ADMIN_EMAIL` | address that receives admin notifications |
   | `GEMINI_API_KEY_1` | a real Gemini API key, for the AI chat feature |

   `PORT` is set by Render automatically — don't add it yourself.
4. Deploy. First boot will take a minute (Docker build + Hibernate creating
   every table on Supabase). Confirm it's up: `https://<your-service>.onrender.com/api/auth/login`
   should return a 400 (not a connection error) for a POST with an empty body.
5. **Free-tier note:** Render's free web services spin down after 15 minutes of
   no traffic and take ~30-60s to wake back up on the next request. Fine for a
   demo; if that's a problem, upgrade the plan later — nothing else changes.

## 3. Vercel — frontend

1. Import the same GitHub repo. Set **Root Directory** to
   `Water-Usage-Monitoring-System/frontend`. Vercel auto-detects Vite.
2. Project Settings → Environment Variables → add:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`
3. Deploy.
4. Copy the resulting `https://<something>.vercel.app` URL, and go back to
   Render to set `FRONTEND_URL` and `CORS_EXTRA_ORIGINS` to it (step 2.3), then
   redeploy the backend so the two know about each other.

## Pushing to GitHub

If you don't already have a repo for this:

```bash
git init
git add .
git commit -m "Prepare for Vercel + Render + Supabase deployment"
git remote add origin <your-new-repo-url>
git push -u origin main
```

`.gitignore` already excludes build output, `node_modules`, and the local
secrets override file (`backend/spring-boot-app/application.properties`) —
verify with `git status` before your first commit that none of those, or any
other secret, show up as staged.

## After both are live — a full checklist

- [ ] Open the Vercel URL, sign in as each of the three demo roles, confirm data loads
- [ ] A payment on Current Bill generates a downloadable PDF and (if `MAIL_*` is set) an email
- [ ] Alerts/notifications load on the resident and admin dashboards
- [ ] Refreshing on a deep link (e.g. `/resident/dashboard`) doesn't 404 — this is what `vercel.json`'s rewrite is for
- [ ] Open the same Vercel URL from a phone (not on the office/home LAN — a real mobile network) to confirm it isn't accidentally still relying on the local-network proxy setup from before
