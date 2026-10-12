# Recomp Pro (Core)

**Recomp Pro** is a modern, self-hosted web application for tracking body composition, bioimpedance metrics, and fitness recomposition progress. It imports data directly from smart scales (compatible with Fitdays CSV/XLSX exports) and provides longitudinal trend analysis, segmental breakdowns, and secure report sharing.

> This is the **Core** repository — 100% free, open-source, and self-hostable.

---

## Key Features

- **Progress Dashboard & Biometrics Analysis**: Track weight, body fat (`%` and `kg`), skeletal muscle mass (`%` and `kg`), visceral fat, BMR/TMB, metabolic age, and 5-zone segmental body composition (`All`, `1M`, `3M`, `6M`, `1Y` horizons).
- **Unit-Aware Smart Scale Importer**: Drag-and-drop CSV/XLSX importer with automatic header unit classification (`%`, `kg`, `kcal`, `kg/m²`) and minute-precision timestamp deduplication.
- **Report Attachments**: Attach original PDF or image bioimpedance reports to individual scan records with inline drawer preview.
- **Secure Guest Sharing**: Generate expirable, optionally password-protected shared links for doctors, nutritionists, or coaches — including automatic synchronization of starred records (`auto_share_starred`) and access audit logs.
- **Hydration-Safe Multi-Language i18n**: Full support for **English (`en`)**, **Portuguese (`pt`)**, and **Spanish (`es`)** with zero-FOUC server-side locale detection.
- **Privacy & GDPR/LGPD Controls**: Self-service health data erasure and permanent account deletion with password confirmation.
- **Interactive OpenAPI Specification**: Built-in API documentation available at `/docs`.

---

## Architecture & Tech Stack

Recomp Pro runs as a single-container full-stack monolith:

- **Runtime & Framework**: Node.js 22+ & Next.js 16 (App Router, React 19, TypeScript)
- **Styling & Design System**: Tailwind CSS v4 (*Kinetic Indigo* theme with dark/light mode)
- **Database & ORM**: Local SQLite (`recomp_pro.db`) via `@libsql/client` and Drizzle ORM (automatic migrations on container startup via `src/instrumentation.ts`)
- **Authentication**: Stateless JWT (`jose`), `bcryptjs` password hashing, and 6-digit OTP email verification
- **Testing**: Vitest + React Testing Library
- **Containerization**: Multi-architecture Docker images (`linux/amd64` and `linux/arm64`) published to `ghcr.io/cfassoni/recomppro-core/app`

---

## Quick Start (Docker)

### Production Image (Recommended)

Deploy using the pre-built multi-arch image from GitHub Container Registry:

```bash
git clone https://github.com/cfassoni/RecompPro-core.git
cd RecompPro-core

# Start the production stack (persists SQLite DB and uploads in the recomp_pro_data volume)
SECRET_KEY="replace_with_a_strong_random_secret" docker compose -f docker-compose.prod.yml up -d
```

The application will be available at `http://localhost` (port `80`).

### Build Locally with Docker Compose

```bash
docker compose up -d --build
```

The local Compose stack exposes the app at `http://localhost:3000`.

For Portainer stack deployment, runtime environment variables (`ENABLE_WIP_PAGES`, Mailgun SMTP/API, etc.), and SQLite backup/restore procedures, see the **[Deployment Guide](./DEPLOYMENT.md)**.

---

## Local Development

Requires **Node.js 22+**.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (creates ./recomp_pro.db automatically)
npm run dev
```

### Verification Suite

```bash
npm run lint    # ESLint static analysis
npm test        # Vitest unit & integration test suite
npm run build   # Next.js production build check
```

For branching guidelines, commit conventions, and release procedures, see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.
