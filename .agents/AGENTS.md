# Workspace Agent Rules

## 1. Development & Branching Hierarchy

```
main (Production, tagged releases only)
  ▲
  │ (User-Approved Release PR)
preview (Staging / Integration base)
  ▲
  │ (User-Approved Feature/Fix PR)
feat/* | fix/* | docs/* (Isolated feature branches)
```

- **Branch Hierarchy & PR Targets**:
  - All feature and task development must occur on dedicated feature branches (e.g., `feat/<feature-name>`, `fix/<bug-name>`).
  - Pull Requests from feature branches must **ALWAYS** target the **`preview`** branch (`gh pr create --base preview`).
  - Direct pushes to `main` or `preview` are strictly forbidden.
  - The `main` branch is strictly reserved for release cutovers promoted from `preview`.

- **Link and Close GitHub Issues**: When creating a Pull Request, always include closing keywords (e.g., `Closes #<issue_number>` or `Fixes #<issue_number>`) in the Pull Request description so that the associated issue is automatically closed when the PR is merged.

---

## 2. Hard Autonomy Boundaries (The Approval Gates)

| Action | Allowed Autonomously? | Protocol / Requirement |
| :--- | :---: | :--- |
| **Researching codebase / reading files** | 🟢 **YES** | Proactive exploration. |
| **Editing code files locally** | 🟢 **YES** | Keep changes isolated and focused on the active task. |
| **Running verification suite (`lint`, `test`, `build`)** | 🟢 **YES** | Always verify before declaring work complete. |
| **Creating local feature branch (`fix/*`, `feat/*`)** | 🟢 **YES** | Always branch off latest `preview`. |
| **Committing locally on feature branch** | 🟢 **YES** | Use Conventional Commits (`feat:`, `fix:`, `chore:`). |
| **Merging feature branch locally into `preview` or `main`** | 🛑 **NEVER** | **Requires explicit written user approval after user testing.** |
| **Pushing to remote repository (`git push`)** | 🛑 **NEVER** | **Requires explicit written user approval.** |
| **Creating Pull Requests (`gh pr create`)** | 🛑 **NEVER** | **Requires explicit written user approval.** |
| **Merging Pull Requests (`gh pr merge`)** | 🛑 **NEVER** | **Requires explicit written user approval.** |
| **Publishing Releases / Tags (`gh release create`)** | 🛑 **NEVER** | **Requires explicit written user approval.** |

---

## 3. Technical & Architectural Invariants

- **100% Pure Node.js Toolchain (Zero Python)**:
  - The application runtime and developer tooling are strictly Node.js 22+ and TypeScript.
  - Version bumping is managed via `npm run version:bump <version>` (updating `VERSION`, `package.json`, and `Version.tsx`).

- **Database Migrations (Drizzle ORM)**:
  - Schema changes in `src/db/schema.ts` must include corresponding Drizzle migration scripts generated via `npm run db:generate`.
  - Migrations run automatically on startup via `src/instrumentation.ts`. Direct/manual changes to production databases are strictly forbidden.

- **Zero-FOUC & Hydration-Safe i18n**:
  - All user-facing text, tooltips (`title`), screen reader descriptions (`aria-label`), and menu/button labels must be fully internationalized with exact key parity across `src/locales/{en,pt,es}.json`.
  - Server components (e.g., `src/app/layout.tsx`) must **NEVER** import client-only `react-i18next` modules. Use pure server-safe helpers (`src/lib/locale.ts`) with native `next/headers` (`cookies()`, `headers()`) to prevent React hydration errors (Error #418) and flashes of untranslated content (FOUC).

- **Dynamic Runtime Configuration (Zero-Rebuild Flags)**:
  - Feature flags (like `ENABLE_WIP_PAGES`) must be read on the server (`layout.tsx`) and injected into context/props so that environment variable changes in `docker-compose.yml` take effect upon container restart without requiring Docker image rebuilds.

- **Brand Sanitization in Client Storage**:
  - Never use legacy branding identifiers (`fitdays*`) in client-accessible storage (`localStorage`, session cookies, URL query params). Always use active brand namespaces (`recomp_pro_*` / `recomp_*`).

- **Infrastructure & Operational Logging**:
  - All Node.js server logging and Docker container shell commands/init containers must format timestamps with `[YYYY-MM-DD HH:MM:SS]` for observability.
  - Always specify explicit `name` properties for Docker named volumes (e.g., `volumes: recomp_pro_data: name: recomp_pro_data`) to prevent Docker Compose from prefixing project names.

---

## 4. DOs and DON'Ts Reference Table

### ✅ DOs
- **DO** keep all active work isolated on dedicated `feat/*` or `fix/*` branches.
- **DO** run and pass the full local verification suite (`npm run lint`, `npm test`, `npm run build`, `docker compose build`) before presenting completed work.
- **DO** leave the testing and validation in the hands of the user before suggesting any branch merges or remote actions.
- **DO** link and close GitHub issues in PR bodies using standard keywords (e.g., `Closes #64`).
- **DO** ensure Docker volumes use explicit names (e.g., `recomp_pro_data`) and legacy volumes use `external: true` for Portainer compatibility.
- **DO** write comprehensive unit/integration tests for every newly added feature or bug fix.

### ❌ DON'Ts
- **DON'T EVER** push to `origin` without explicit user permission.
- **DON'T EVER** open or merge a Pull Request without explicit user permission.
- **DON'T EVER** merge a feature branch into local `preview` or `main` before the user has finished testing on the feature branch.
- **DON'T EVER** target `main` directly for feature PRs (all feature PRs must target `preview`).
- **DON'T EVER** introduce Python scripts or `uv` dependencies into the repository.
- **DON'T EVER** import `react-i18next` inside Next.js Server Components.
- **DON'T EVER** delete Git branches without explicit user instruction.
- **DON'T EVER** attempt large "big-bang" architectural changes in a single step; always deliver in testable, incremental milestones.

