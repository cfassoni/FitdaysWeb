# Recomp Pro (Core)

**Recomp Pro** is a modern, self-hosted web application for tracking your body composition and fitness progress. It imports data directly from smart scales (like Fitdays) and provides detailed trend analysis.

> This is the **Core** repository, completely free and open-source.

## Architecture

Recomp Pro is built as a modular monolith using Next.js 16 (App Router) and Drizzle ORM.
- **Frontend & Backend**: Next.js (React 19)
- **Database**: SQLite (local) via Drizzle ORM
- **Authentication**: JWT, bcryptjs, custom OTP flow
- **I18n**: English, Portuguese, Spanish

## Quick Start (Docker)

The easiest way to run Recomp Pro is using Docker Compose. The database and user uploads are persisted in a local volume.

```bash
git clone https://github.com/cfassoni/RecompPro-core.git
cd RecompPro-core

# Edit the environment variables if needed
cp docker-compose.yml docker-compose.prod.yml

docker compose -f docker-compose.prod.yml up -d
```

The application will be available at `http://localhost`.

## Development

Requires Node.js 22.

```bash
npm install
npm run dev
```

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md).
