# Frontend (Next.js)

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How API calls work

This frontend does **not** use Next.js `app/api/*` routes. It talks to the separate Fastify backend:

- **Local:** browser → `http://localhost:5001/api/v1/*` (via `NEXT_PUBLIC_API_URL`)
- **Vercel:** browser → `/api/v1/*` on your Vercel domain → **rewrite** → Render backend

That is why Vercel build logs show no `/api` routes — that is expected.

## Deploy on Vercel

| Setting | Value |
| -------- | ------ |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Environment variable** | `BACKEND_URL=https://YOUR-RENDER-SERVICE.onrender.com` |

Optional: set `NEXT_PUBLIC_API_URL=/api/v1` (default if omitted).

## Render backend (CORS)

On Render, set `CORS_ORIGIN` to your Vercel URL (comma-separated if you also use localhost):

```
CORS_ORIGIN=http://localhost:3000,https://your-app.vercel.app
```

Only needed if the browser calls the Render URL directly. With Vercel rewrites, requests are same-origin and CORS is not required.
