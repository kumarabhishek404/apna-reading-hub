# Deploy Reading Hub

Guides for **Vercel** (frontend), **Docker**, and **Render** (API + Postgres).

## Deploy full stack on Vercel (frontend + backend)

One Vercel project serves **Next.js and the Express API** together. The API is mounted at `/api/*` via a serverless catch-all that imports the Express app.

### 1. Create a Postgres database

Vercel serverless cannot use SQLite. Create a free DB (any one):

- [Neon](https://neon.tech) → copy the connection string  
- [Supabase](https://supabase.com) → Project Settings → Database → URI  
- [Vercel Postgres](https://vercel.com/storage/postgres)

### 2. Import the repo on Vercel

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Set **Root Directory** to `frontend` (Edit → select `frontend`).
4. Open **Build and Development Settings** and set:

| Setting | Value |
|---------|--------|
| Framework Preset | **Next.js** |
| Build Command | Leave as from `vercel.json` (or clear override) |
| Output Directory | **Leave empty** — turn **Override** OFF (do not use `public`) |
| Install Command | Leave as from `vercel.json` |

> If you see `No Output Directory named "public"`, the project is not using the Next.js preset. Set Framework to **Next.js**, clear Output Directory, ensure Root Directory is `frontend`, then redeploy.

### 3. Environment variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your **PostgreSQL** connection string (required) |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` (optional, CORS) |

Do **not** set `NEXT_PUBLIC_API_URL` or `INTERNAL_API_URL` — the frontend will call `/api` on the same origin.

### 4. Deploy

Click Deploy. The build runs `scripts/prepare-vercel-db.js` (switches Prisma to Postgres, generates client, pushes schema).

### Notes

- PDF uploads on Vercel are stored under `/tmp` and **may be lost** when the serverless instance recycles. For durable PDFs later, use Vercel Blob or S3.
- Local development is unchanged: run `npm run dev` with SQLite + separate API on port 4000.

---

## Deploy frontend only on Vercel (API elsewhere)

If the API stays on Render (or similar), set Root Directory to `frontend` and:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Your API URL, e.g. `https://reading-hub-api.onrender.com` |
| `INTERNAL_API_URL` | Same API URL |

---

## Container / Docker deploy

A root [`Dockerfile`](./Dockerfile) builds **both** the API and the Next.js app into one image (public port = Next.js; API listens on `4000` inside the container).

It uses **SQLite by default** — no `DATABASE_URL` is required. Push and redeploy.

**Optional env vars:**

| Key | Value |
|-----|-------|
| `PORT` | Usually injected by the platform (defaults to `3000`) |
| `FRONTEND_URL` | Your public app URL (for CORS) |
| `DATABASE_URL` | Override only if you intentionally use a custom SQLite path |

> SQLite data lives on the container filesystem and is **lost on redeploy** unless you mount a persistent volume at `/app/backend/prisma` (and `/app/backend/uploads` for PDFs). For durable data, use the Render + PostgreSQL setup below.

---

## Render (Node runtimes)

## Architecture on Render

| Service | Type | Example URL |
|---------|------|-------------|
| `reading-hub-web` | Web Service (Next.js) | `https://reading-hub-web.onrender.com` |
| `reading-hub-api` | Web Service (Express) | `https://reading-hub-api.onrender.com` |
| `reading-hub-db` | PostgreSQL | Internal connection string |

> **Why PostgreSQL?** Render's filesystem is ephemeral. SQLite files and uploaded PDFs are **lost on every redeploy** on the free tier. PostgreSQL (free on Render) keeps your data safe.

---

## Option A: One-click Blueprint (recommended)

### 1. Push code to GitHub

```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Create Blueprint on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **+ New** → **Blueprint**
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically
5. Click **Apply**

This creates all 3 resources: database, API, and frontend.

### 3. Set environment variables

After the first deploy, go to each web service and set:

**`reading-hub-api` → Environment:**

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://reading-hub-web.onrender.com` (your frontend URL) |

**`reading-hub-web` → Environment:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://reading-hub-api.onrender.com` |
| `INTERNAL_API_URL` | `https://reading-hub-api.onrender.com` |

### 4. Redeploy both services

After setting env vars, click **Manual Deploy → Deploy latest commit** on both services.

---

## Option B: Manual setup (using the Render UI)

### Step 1: Create PostgreSQL database

1. **+ New** → **Postgres**
2. Name: `reading-hub-db`
3. Plan: **Free**
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 2: Deploy the backend API

1. **+ New** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Field | Value |
|-------|-------|
| Name | `reading-hub-api` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `NPM_CONFIG_PRODUCTION=false npm install && npx prisma generate && npx prisma db push && npm run build` |
| Start Command | `npm start` |
| Plan | Free |

4. **Environment variables:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste Internal Database URL from Step 1 |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Leave blank for now, set after Step 3 |

5. Click **Create Web Service**
6. Note the URL: `https://reading-hub-api.onrender.com`

### Step 3: Deploy the frontend

1. **+ New** → **Web Service**
2. Same repo
3. Configure:

| Field | Value |
|-------|-------|
| Name | `reading-hub-web` |
| Root Directory | `frontend` |
| Runtime | Node |
| Build Command | `cd .. && NPM_CONFIG_PRODUCTION=false npm install && cd frontend && npm run build` |
| Start Command | `npm start` |
| Plan | Free |

4. **Environment variables:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://reading-hub-api.onrender.com` |
| `INTERNAL_API_URL` | `https://reading-hub-api.onrender.com` |
| `NODE_ENV` | `production` |

5. Click **Create Web Service**
6. Note the URL: `https://reading-hub-web.onrender.com`

### Step 4: Link frontend and backend

1. Go to **reading-hub-api** → Environment
2. Set `FRONTEND_URL` = `https://reading-hub-web.onrender.com`
3. **Manual Deploy** both services

---

## Verify deployment

1. Open `https://reading-hub-api.onrender.com/health` → should return `{"status":"ok"}`
2. Open `https://reading-hub-web.onrender.com` → dashboard loads
3. Add a link or note to confirm the database works

---

## Local development (PostgreSQL)

The schema now uses PostgreSQL. For local dev:

```bash
# Start local Postgres
docker compose up -d

# Copy env file
cp backend/.env.example backend/.env

# Push schema & start
cd backend && npx prisma db push
cd .. && npm run dev
```

---

## Important notes

### Free tier limitations

| Limitation | Detail |
|------------|--------|
| **Sleep** | Services spin down after 15 min of inactivity. First visit takes ~30s to wake up. |
| **Postgres** | Free database expires after 90 days (renew or upgrade). |
| **PDF uploads** | Stored on ephemeral disk — **PDFs may be lost on redeploy**. Upgrade to a paid plan + disk for persistence. |
| **Build time** | Free tier has limited build minutes per month. |

### PDF persistence (optional upgrade)

On a **Starter** plan ($7/mo), add a persistent disk to `reading-hub-api`:

1. Service → **Disks** → Add disk
2. Mount path: `/opt/render/project/src/backend/uploads`
3. Set env `UPLOADS_DIR=/opt/render/project/src/backend/uploads`

### Custom domain

1. Add your domain in each Web Service → **Settings** → **Custom Domains**
2. Update `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, and `INTERNAL_API_URL` accordingly

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Dashboard shows API error | Check backend is running at `/health`. Verify `NEXT_PUBLIC_API_URL`. |
| CORS errors | Set `FRONTEND_URL` on the API to match your frontend URL exactly. |
| Database connection failed | Use the **Internal** Database URL on the API service, not External. |
| Build fails on Prisma | Ensure `DATABASE_URL` is set before build (Blueprint handles this automatically). |
