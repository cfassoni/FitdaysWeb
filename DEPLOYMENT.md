# Deployment Guide

Recomp Pro is currently optimized for self-hosting via Docker.

## Option A: Docker Compose (Recommended)

1. Ensure you have Docker and Docker Compose installed.
2. Review `docker-compose.prod.yml` and modify the environment variables (e.g., `SECRET_KEY`, `MAILGUN_API_KEY`, `MAIL_FROM_ADDRESS`).
3. Run:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
4. A persistent volume `recomp_pro_data` is created to securely store your SQLite database and profile pictures.

## Legacy Migration (From v0.3.0 to v0.4.0)

If you are upgrading from `FitdaysWeb` (Python + Nginx multi-container) to `Recomp Pro v0.4.0` (Next.js single-container):

1. Stop the old containers: `docker compose down`
2. Update your `docker-compose.yml` (or `docker-compose.prod.yml`) to the new Next.js single-container architecture.
3. Start the stack: `docker compose up -d`
4. The integrated `data-migrator` service will automatically and safely copy your SQLite database (`fitdays.db`) and uploaded media from the legacy volume (`fitdaysweb_fitdays-db-data`) into `recomp_pro_data` on first startup.
5. The application will automatically verify the database schema and apply Drizzle migrations on startup without data loss.

## Future: Cloudflare Pages

Cloudflare Pages deployment (with D1 and R2 storage) is planned for the near future.
