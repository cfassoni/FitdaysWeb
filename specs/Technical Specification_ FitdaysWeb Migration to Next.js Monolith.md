Here is a concise, highly detailed, and technical specification document designed to be fed directly into your development AI to initialize the project and plan the implementation.

---

Technical Specification: FitdaysWeb Migration to Next.js Monolith

**Target Infrastructure:** Cloudflare Pages (Edge Runtime) & Cloudflare D1 (SQLite)

**Cost Target:** $0.00 (Fully within Cloudflare Always-Free Tier)

**Architecture Pattern:** Modern Modular Monolith

---

1\. System Architecture Overview

\[ GitHub Repository \]  
    ├── Branch: preview  ──►  Deploy: Cloudflare Pages (Preview)  ──►  DB: Cloudflare D1 (Preview)  
    └── Branch: main     ──►  Deploy: Cloudflare Pages (Production) ──►  DB: Cloudflare D1 (Production)

* **Frontend & Backend Unified:** Next.js (App Router) running entirely on the **Cloudflare Edge Runtime**.  
* **Database:** Cloudflare D1 (Serverless native SQLite) managed via **Drizzle ORM** and **Drizzle Kit**.  
* **Version Control & Single Source of Truth:** A root-level VERSION file driving the application UI, Git tagging, and GitHub Releases.

---

2\. Infrastructure Configuration (wrangler.toml)

The project uses Cloudflare’s environment separation to isolate production data from testing data.

toml  
\#:schema node\_modules/wrangler/config-schema.json  
name \= "fitdays-monolito"  
compatibility\_date \= "2026-08-19"

\# Production Environment (Default \- tied to 'main' branch)  
\[\[d1\_databases\]\]  
binding \= "DB"  
database\_name \= "fitdays-db-prod"  
database\_id \= "PASTE\_PRODUCTION\_D1\_DATABASE\_ID\_HERE"  
migrations\_dir \= "drizzle"

\# Preview/Testing Environment (Tied to 'preview' branch)  
\[env.preview\]  
\[\[env.preview.d1\_databases\]\]  
binding \= "DB"  
database\_name \= "fitdays-db-preview"  
database\_id \= "PASTE\_PREVIEW\_D1\_DATABASE\_ID\_HERE"  
migrations\_dir \= "drizzle"

Use o código com cuidado.  
---

3\. Modular Monolith Directory Structure

fitdaysweb-next/  
├── .github/  
│   └── workflows/  
│       ├── restrict-main.yml  
│       └── release.yml  
├── app/  
│   ├── (modules)/  
│   │   ├── auth/            \# Auth UI and API Routes (/api/auth/\*)  
│   │   ├── dashboard/       \# Evolution metrics and Recharts graphs  
│   │   └── import/          \# Excel upload UI & TS-based spreadsheet parser  
│   ├── components/  
│   │   └── Footer.tsx       \# Component displaying the exact version  
│   ├── db/  
│   │   ├── client.ts        \# D1 / Drizzle binding  
│   │   └── schema.ts        \# Database schema definitions (TypeScript)  
│   ├── layout.tsx  
│   └── page.tsx  
├── drizzle/                 \# Auto-generated .sql migration files  
├── drizzle.config.ts        \# Drizzle Kit CLI configuration  
├── next.config.mjs          \# Configured with \`experimental: { runtime: 'edge' }\`  
├── package.json  
└── VERSION                  \# Single Source of Truth for SemVer (e.g., 1.1.0-beta.0)

---

4\. Database Migrations Workflow

1. **Define changes** in app/db/schema.ts using TypeScript.

**Generate Migration SQL files** locally using Drizzle Kit:  
bash  
npx drizzle-kit generate

2. Use o código com cuidado.

**Apply to Preview DB** (Executes remotely against the preview D1 database instance):  
bash  
npx wrangler d1 migrations apply fitdays-db-preview \--remote \--env preview

3. Use o código com cuidado.

**Apply to Production DB** (Executed only after code is merged into main):  
bash  
npx wrangler d1 migrations apply fitdays-db-prod \--remote

4. Use o código com cuidado.

*Note: All migrations must be backwards-compatible (never run destructive schema changes while old serverless instances are still routing traffic).*

---

5\. Git Branching & CI/CD Strategy

Guardrail Policy: Protected main

To enforce rigorous testing, main **must only accept Pull Requests originating from the preview branch**. Direct commits or merges from feature branches to main are blocked.

**.github/workflows/restrict-main.yml**

yaml  
name: Restrict PR Origin

on:  
  pull\_request:  
    branches:  
      \- main

jobs:  
  check-branch:  
    runs-on: ubuntu-latest  
    steps:  
      \- name: Validate branch origin  
        if: github.head\_ref \!= 'preview'  
        run: |  
          echo "ERROR: Pull Requests targeting 'main' must originate from 'preview' branch\!"  
          exit 1

Use o código com cuidado.

Versioning & Automated Release Management

* **Beta/Prerelease Nomenclatures:** X.Y.Z-beta.N (e.g., 1.1.0-beta.0).  
* **Stable Nomenclatures:** X.Y.Z (e.g., 1.1.0).

**.github/workflows/release.yml**

yaml  
name: Semantic Versioning & GitHub Release

on:  
  push:  
    branches:  
      \- main

jobs:  
  release:  
    runs-on: ubuntu-latest  
    steps:  
      \- name: Checkout Code  
        uses: actions/checkout@v4

      \- name: Parse VERSION File  
        id: get\_version  
        run: |  
          VERSION=$(cat VERSION | tr \-d '\\r\\n')  
          echo "version=$VERSION" \>\> $GITHUB\_OUTPUT

      \- name: Determine Prerelease Status  
        id: check\_beta  
        run: |  
          if \[\[ "${{ steps.get\_version.outputs.version }}" \== \*"-beta."\* \]\]; then  
            echo "is\_prerelease=true" \>\> $GITHUB\_OUTPUT  
          else  
            echo "is\_prerelease=false" \>\> $GITHUB\_OUTPUT  
          fi

      \- name: Create GitHub Release  
        uses: softprops/action-gh-release@v2  
        with:  
          tag\_name: v${{ steps.get\_version.outputs.version }}  
          name: Release v${{ steps.get\_version.outputs.version }}  
          prerelease: ${{ steps.check\_beta.outputs.is\_prerelease }}  
        env:  
          GITHUB\_TOKEN: ${{ secrets.GITHUB\_TOKEN }}

Use o código com cuidado.  
---

6\. Version Propagation to UI Component

Because Next.js defaults to Server Components, the frontend reads the local VERSION file straight from disk during compilation/execution, bypassing runtime env variable injections.

tsx  
// app/components/Footer.tsx  
import fs from 'fs';  
import path from 'path';

export default function Footer() {  
  const versionPath \= path.join(process.cwd(), 'VERSION');  
  const version \= fs.readFileSync(versionPath, 'utf8').trim();

  return (  
    \<footer className="p-4 text-center text-sm text-muted"\>  
      FitdaysWeb — Version \<strong\>{version}\</strong\>  
    \</footer\>  
  );  
}

Use o código com cuidado.  
---

7\. Emergency Roll-Back Playbook

If a critical degradation occurs in production after a merge to main:

1. **Instant Roll-Back (Cloudflare Dashboard):** Navigate to *Workers & Pages* \-\> *Deployments*. Find the last stable deployment hash, click the options menu (...), and select **Rollback deployment**. Traffic routes back globally within \~5 seconds.  
2. **Git Aligning:** Execute a git revert \<merge-commit-hash\> directly on main to align the Git tree. Downgrade or patch the VERSION file accordingly, and push to deploy the structural hotfix.

---

