# Workspace Agent Rules

## Development Workflow

- **GitHub PR Workflow Only**: All changes must be proposed via GitHub Pull Requests. Direct pushes to the `main` branch are strictly forbidden. Always create a feature branch, push the branch, and create a pull request.

- **Database Migrations Required**: Any changes to the database schema must include corresponding Alembic migration scripts. The application must run these migrations automatically on startup. Direct/manual changes to production databases are strictly forbidden.

- **Python Management via UV**: This project uses `uv` for Python environment and dependency management. Always run Python/pip related commands, tests, database migrations, and scripts using `uv` (e.g., `uv run`, `uv pip`, etc.).

- **Contribution Guidelines**: Always read and follow the instructions in [CONTRIBUTING.md](CONTRIBUTING.md) when developing features, tracking versions, or preparing releases (e.g., using `python scripts/bump_version.py` for version bumps).

- **Frontend Internationalization (i18n)**: All user-facing text, tooltips (`title`), screen reader descriptions (`aria-label`), and menu/button labels in the React frontend must be fully internationalized using `useTranslation` from `react-i18next`. Avoid hardcoded strings in components. Ensure new translation keys are updated in all locale JSON files (`en.json`, `pt.json`, `es.json`) and appropriate test mocks are updated.

## Git Commits and Push Policy

- Use **Conventional Commits** for all commit messages in this project.
  - Format: `<type>(<optional-scope>): <description>`
  - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - Use imperative mood in descriptions (e.g., "add feature", "fix bug").

- Stage files to prepare for a commit, but **do not commit** without explicit approval from the user.

- **Do not push** to remote repositories without explicit approval from the user.
