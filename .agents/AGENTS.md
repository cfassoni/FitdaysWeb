# Workspace Agent Rules

- **GitHub PR Workflow Only**: All changes must be proposed via GitHub Pull Requests. Direct pushes to the `main` branch are strictly forbidden. Always create a feature branch, push the branch, and create a pull request.

- **Database Migrations Required**: Any changes to the database schema must include corresponding Alembic migration scripts. The application must run these migrations automatically on startup. Direct/manual changes to production databases are strictly forbidden.

- **Python Management via UV**: This project uses `uv` for Python environment and dependency management. Always run Python/pip related commands, tests, database migrations, and scripts using `uv` (e.g., `uv run`, `uv pip`, etc.).
