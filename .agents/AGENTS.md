# Workspace Agent Rules

## Development & Branching Workflow

- **Branch Hierarchy & PR Targets**:
  - All feature and task development must occur on dedicated feature branches (e.g., `feat/<feature-name>`).
  - Pull Requests from feature branches must **ALWAYS** target the **`preview`** branch (`gh pr create --base preview`).
  - Direct pushes to `main` or `preview` are strictly forbidden.
  - The `main` branch is strictly reserved for release cutovers promoted from `preview`.

- **Link and Close GitHub Issues**: When creating a Pull Request, always include closing keywords (e.g., `Closes #<issue_number>` or `Fixes #<issue_number>`) in the Pull Request description so that the associated issue is automatically closed when the PR is merged.

- **Pre-PR Verification Checklist**: Before requesting user approval for commits/PRs or pushing branches, always execute and pass the complete local verification suite:
  - **Checks**: `npm run lint` and `npm test`
  - **Build**: `npm run build`

- **Database Migrations (Drizzle ORM)**: Any changes to the database schema must include corresponding Drizzle migration scripts generated via `npm run db:generate`. The application must run these migrations automatically on startup via `src/instrumentation.ts`. Direct/manual changes to production databases are strictly forbidden.

- **Contribution & Versioning Guidelines**: Always read and follow the instructions in [CONTRIBUTING.md](CONTRIBUTING.md) when developing features, tracking versions, or preparing releases (e.g., using `uv run python scripts/bump_version.py <version>`).

## Frontend & SSR Invariants

- **Zero-FOUC & Hydration Safe i18n**:
  - All user-facing text, tooltips (`title`), screen reader descriptions (`aria-label`), and menu/button labels must be fully internationalized with exact key parity across `src/locales/{en,pt,es}.json`.
  - Server components (e.g., `src/app/layout.tsx`) must **NEVER** import client-only `react-i18next` modules. Use pure server-safe helpers (`src/lib/locale.ts`) with native `next/headers` (`cookies()`, `headers()`) to prevent React hydration errors (Error #418) and avoid flashes of untranslated content (FOUC).

- **Brand Sanitization in Client Storage**:
  - Never use legacy branding identifiers (`fitdays*`) in client-accessible storage (`localStorage`, session cookies, URL query params). Always use active brand namespaces (`recomp_pro_*` / `recomp_*`).

## Infrastructure & Operational Logging

- **Timestamped Container Logs**:
  - All Node.js server logging and Docker container shell commands/init containers must format timestamps with `[YYYY-MM-DD HH:MM:SS]` for observability.

- **Explicit Docker Compose Volume Naming**:
  - Always specify explicit `name` properties for Docker named volumes (e.g., `volumes: recomp_pro_data: name: recomp_pro_data`) to prevent Docker Compose from prefixing project names.

## Git Commits and Push Policy

- Use **Conventional Commits** for all commit messages in this project.
  - Format: `<type>(<optional-scope>): <description>`
  - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - Use imperative mood in descriptions (e.g., "add feature", "fix bug").

- Stage files to prepare for a commit, but **do not commit** without explicit approval from the user.

- **Do not push** to remote repositories without explicit approval from the user.

## Lessons Learned & Step-Wise Delivery Policy

- **Iterative & Incremental Delivery Only**: Never attempt massive "big bang" full-stack architectural rewrites in a single step. All major refactors or stack migrations must be broken down into small, isolated, and testable milestones with end-to-end working software at every phase.
- **Strict Scope & Functionality Alignment**: Always confirm exact functional expectations and testing criteria with the user *before* scaffolding or replacing core architecture.
- **Workspace & Artifact Cleanliness**: When switching branches or rolling back experimental work, always explicitly purge untracked build artifacts (`.next/`, temporary cache, database files) to prevent polluting the user's IDE file watcher and source control tree.
