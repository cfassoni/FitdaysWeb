# Contributing to Recomp Pro

Thank you for contributing to **Recomp Pro (Core)**!

---

## 1. Local Development Setup

1. **Install Node.js 22+**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Database**: A local SQLite database file (`recomp_pro.db`) is created and migrated automatically on startup.
4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 2. Branching Hierarchy & Pull Request Workflow

```text
main (Production, tagged releases only)
  ▲
  │ (Release PR: chore(release): vX.Y.Z — ...)
preview (Staging / Integration base)
  ▲
  │ (Feature / Fix PR)
feat/* | fix/* | docs/* | chore/* (Isolated branches)
```

- **Feature & Fix Branches**: Always branch off the latest `preview` branch (`git checkout -b feat/<name> preview`).
- **Pull Request Target**: All feature, fix, and documentation Pull Requests **must target `preview`** (`--base preview`). Direct pushes to `preview` or `main` are forbidden.
- **Issue Linking**: Include closing keywords (`Closes #<issue>` or `Fixes #<issue>`) in Pull Request descriptions when resolving an issue.

---

## 3. Conventional Commits & Semantic PR Titles

All commits and Pull Request titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (validated in CI by `.github/workflows/pr-title-check.yml`):

- Allowed prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `revert:`.
- Release Pull Requests from `preview` to `main` must use:
  ```text
  chore(release): v<version> — <summary>
  ```

---

## 4. Verification Checks

Before opening a Pull Request, ensure the full verification suite passes locally:

```bash
# 1. Linting
npm run lint

# 2. Unit & Integration Tests (Vitest)
npm test

# 3. Production Build (Next.js App Router)
npm run build

# 4. Container Build Verification
docker compose build
```

---

## 5. Database Schema Changes (Drizzle ORM)

When modifying `src/db/schema.ts`:
1. Generate the corresponding SQL migration and snapshot:
   ```bash
   npm run db:generate
   ```
2. Commit both `src/db/schema.ts` and the generated files under `src/db/migrations/`. Migrations are applied automatically on startup via `src/instrumentation.ts`.

---

## 6. Release Process

To prepare a new release on `preview` before promoting to `main`:

```bash
npm run version:bump <major.minor.patch>
```

This script updates `VERSION`, `package.json`, and `src/components/Version.tsx` in lockstep. Once merged into `main` and published as a GitHub Release (`v<version>`), `.github/workflows/release.yml` automatically builds and publishes multi-architecture Docker images (`linux/amd64` and `linux/arm64`) to `ghcr.io/cfassoni/recomppro-core/app`.
