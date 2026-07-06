# Railway Deploy

This repository is prepared to run as three Railway services from the same monorepo:

- `frontend` -> Next.js website
- `backend` -> Express + Prisma API
- `scraper` -> Python scheduler worker

## Backend service

- Root directory: `backend`
- Builder: Dockerfile
- Variables:
  - `PORT=5000`
  - `BACKEND_PORT=5000`
  - `DATABASE_URL=file:/data/dev.db`
  - `JWT_SECRET=change-me`
  - `JWT_EXPIRES_IN=7d`
  - `SCRAPER_API_KEY=change-me`
  - `SCRAPER_INTERVAL_HOURS=12`
  - `SCRAPER_SCHEDULE_PAGES=2`
  - `SCRAPER_ENABLE_DONYAYESERIAL=false`
  - `SCRAPER_ALLOW_DIRECT_DOWNLOAD_LINKS=false`
  - `SCRAPER_ALLOWED_DOWNLOAD_HOSTS=`
  - `CORS_ORIGINS=https://your-frontend-domain.up.railway.app`
- Railway volume:
  - Mount path: `/data`
- Optional pre-deploy command:
  - `npx prisma db push`

## Frontend service

- Root directory: `frontend`
- Builder: Dockerfile
- Variables:
  - `NEXT_PUBLIC_API_URL=https://your-backend-domain.up.railway.app/api`
  - `BACKEND_INTERNAL_URL=https://your-backend-domain.up.railway.app/api`

## Scraper worker

- Root directory: `scraper`
- Builder: Dockerfile
- Variables:
  - `BACKEND_URL=https://your-backend-domain.up.railway.app`
  - `SCRAPER_API_KEY=the-same-backend-key`
  - `SCRAPER_INTERVAL_HOURS=12`
  - `SCRAPER_SCHEDULE_PAGES=2`
  - `SCRAPER_ENABLE_DONYAYESERIAL=false`
  - `SCRAPER_ALLOW_DIRECT_DOWNLOAD_LINKS=false`
  - `SCRAPER_ALLOWED_DOWNLOAD_HOSTS=`

## Notes

- Railway monorepo support is documented in Railway's monorepo docs.
- Railway supports persistent volumes; this setup keeps SQLite on a mounted `/data` volume.
- Next.js standalone output is enabled for production container deploys.
