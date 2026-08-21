# Technical Specification: FitdaysWeb (Open-Core Monolith)

**Target Infrastructure:** Cloudflare Pages (Serverless) \+ Cloudflare D1 OR Self-Hosted Docker \+ Native SQLite  
**Architecture Pattern:** Modern Modular Monolith (Open-Core Model)  
**Licensing Split:** Public Core (GitHub Public) / Paid AI Extensions (GitHub Private Submodule)

## 1\. System Architecture & Dual-Runtime Strategy

*\[ Production/Cloudflare SaaS \] ──► Next.js (Cloudflare Pages) ──► Database: Cloudflare D1 (Cloud)*  
*\[ Community/Self-Hosted \] ──► Next.js (Docker Container) ──► Database: Local file (.db File)*

The application is engineered to detect its execution environment dynamically. It scales infinitely on Cloudflare’s Edge network for the SaaS product while remaining fully backwards-compatible with a localized Node.js environment inside a Docker container for the open-source community.

## 2\. Directory Structure & Open-Core Code Splitting

The project isolates premium components and APIs inside a dedicated module directory configured as a Git Submodule pointing to a private repository.

```
fitdaysweb-monorepo/ (Public Core Repository)
├── .github/workflows/
│   ├── restrict-main.yml       # PR protection guardrail
│   └── release.yml             # Automated SemVer tagger & release creator
├── app/
│   ├── (modules)/
│   │   ├── auth/               # Core Feature: Session and registration endpoints
│   │   ├── dashboard/          # Core Feature: Evolution charts (Recharts)
│   │   ├── import/             # Core Feature: TS Spreadsheet Parser (exceljs/xlsx)
│   │   └── premium/            # PRIVATE SUBMODULE: Points to 'fitdaysweb-premium' repo
│   │       ├── api/chat/       # Paid Feature: AI Agent RAG Endpoint
│   │       └── page.tsx        # Paid Feature: AI Consultation UI
│   ├── components/
│   │   └── Footer.tsx          # Reads and displays VERSION on screen
│   ├── db/
│   │   ├── client.ts           # Multi-driver Database abstraction layer
│   │   └── schema.ts           # Unified SQL Schema Definitions (TypeScript)
│   ├── layout.tsx
│   └── page.tsx
├── drizzle/                    # Universal SQL Migration files (.sql)
├── docker-compose.yml          # Community self-hosted setup
├── Dockerfile                  # Production-grade Node.js standalone image
├── drizzle.config.ts           # Drizzle Kit schema synchronizer
├── package.json
└── VERSION                     # Single Source of Truth for App Version (SemVer)
```

## 3\. Database Hybrid Driver Layer

To support both serverless Cloudflare D1 and persistent file-based SQLite via Docker volumes, the database initialization handles runtime routing natively.

```ts
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

let database: any;

if (process.env.DOCKER_MODE === 'true') {
  // Community Deployment: Local file-based SQLite via Docker Volume
  const sqliteClient = createClient({
    url: process.env.DATABASE_URL || 'file:/app/data/fitdays.db',
  });
  database = drizzleLibsql(sqliteClient);
} else {
  // SaaS Deployment: Native Cloudflare D1 (Binding injected into environment)
  database = drizzleD1((process.env as any).DB);
}

export const db = database;
```

## 4\. Self-Hosted Infrastructure Files

### Dockerfile

```
FFROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PRIVATE_STANDALONE=true
RUN npm run build
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DOCKER_MODE=true
ENV PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/standalone/public ./public
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server.js"]

```

### docker-compose.yml

```
vversion: '3.8'
services:
  fitdaysweb-app:
    build: .
    container_name: fitdaysweb_core
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DOCKER_MODE=true
      - DATABASE_URL=file:/app/data/fitdays.db
    volumes:
      - fitdays_storage:/app/data
    restart: always
volumes:
  fitdays_storage:

```

## 5\. Branching, PR Guardrails & Release Lifecycles

### Guardrail Policy: Main Branch Lockdown

The main branch only accepts code merged from the preview branch. Direct merges from feature or experimental branches are mathematically blocked at the platform level.

#### .github/workflows/restrict-main.yml

```
nname: Restrict PR Origin
on:
  pull_request:
    branches:
      - main
jobs:
  check-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Validate branch origin
        if: github.head_ref != 'preview'
        run: |
          echo "CRITICAL ERROR: Merge blocked. PRs to 'main' must originate strictly from 'preview'."
          exit 1

```

### Automated Release and Tagging Pipeline

* **Beta/Prereleases:** Tracked via X.Y.Z-beta.N in the root VERSION file.  
* **Stable Releases:** Tracked via X.Y.Z in the root VERSION file.

#### .github/workflows/release.yml

```
nname: Automated Release & Tagging
on:
  push:
    branches:
      - main
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      - name: Extract Version
        id: get_version
        run: |
          VERSION=$(cat VERSION | tr -d '\r\n')
          echo "version=$VERSION" >> $GITHUB_OUTPUT
      - name: Evaluate Prerelease Status
        id: check_beta
        run: |
          if [[ "${{ steps.get_version.outputs.version }}" == *"-beta."* ]]; then
            echo "is_prerelease=true" >> $GITHUB_OUTPUT
          else
            echo "is_prerelease=false" >> $GITHUB_OUTPUT
          fi
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.get_version.outputs.version }}
          name: Release v${{ steps.get_version.outputs.version }}
          prerelease: ${{ steps.check_beta.outputs.is_prerelease }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```

## 6\. Future-Proofing: AI Agent & Multi-Tenant RAG

To implement the upcoming Premium AI Agent features without shifting back to a heavy Python infrastructure, the Next.js monolith routes requests directly into Cloudflare's serverless vector network.

### Multi-Tenant Data Isolation Strategy

* **Strict Vector Partitioning:** Every vector document embedded from a user's health metric file contains a metadata attribute linking to their unique, verified ID (userId).  
* **Query-Time Constraint:** Vector lookups inject a structural filter query forcing the engine to scan exclusively within the matching userId bounds, ensuring a mathematical impossibility of inter-tenant data leaks.  
* **Hybrid Platform Knowledge:** Global health indices, general rules, and FAQ structures are ingested with a { type: "global\_knowledge" } metadata markup, queryable by all instances.

#### app/api/premium/chat/route.ts

```ts
import { openrouter } from '@ai-sdk/openrouter';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, userId } = await req.json();
  const userQuestion = messages[messages.length - 1].content;
  
  // 1. Vector Database lookup with absolute Multi-Tenant Isolation Filter
  const vectorResults = await env.VECTOR_INDEX.query(userQuestion, {
    topK: 3,
    filter: { userId: userId },
    returnMetadata: true
  });
  
  // 2. Global Knowledge Base lookup (Fallback context)
  const globalResults = await env.GLOBAL_INDEX.query(userQuestion, { topK: 2 });
  
  // 3. Prompt Construction & Cloudflare AI Gateway proxying
  return streamText({
    model: openrouter('google/gemini-2.5-flash'),
    system: `You are the FitdaysWeb Premium Personal Health AI. Use this isolated user history: ${vectorResults}. Additional context: ${globalResults}`,
    messages,
  }).toDataStreamResponse();
}
```

