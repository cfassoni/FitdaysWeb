# Contributing to FitdaysWeb

Thank you for contributing to FitdaysWeb! To maintain high code quality and smooth releases, please follow these guidelines.

---

## 1. Development & Branching Strategy

This project follows a lightweight **GitHub Flow with Release Branches** model:

1. **Feature Branches**: All work (features, bug fixes, chore, etc.) must be done in a short-lived feature branch created from `main`.
   - Name format: `feat/feature-name`, `fix/bug-name`, `chore/task-name`.
2. **Pull Requests**: Open a pull request (PR) targeting `main`.
3. **Merge**: Once reviews pass and the CI check is green, the PR is merged into `main`. Direct pushes to `main` are strictly forbidden.
4. **Stable Releases**:
   - When preparing a new version release, create a release stabilization branch named `release/vX.Y.Z` (e.g. `release/v1.0.0`) off `main`.
   - Test, verify, and resolve any release-specific issues on this branch.
   - Once stable, the version will be tagged and a release published.

---

## 2. Commit Messages & PR Titles

We enforce **Conventional Commits** for all commits and Pull Request titles to ensure a clear git history and automate changelog generation.

### Format
`type(scope): description` (scope is optional)

### Allowed Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation updates
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverting a previous commit

### Imperative Mood
Use the imperative mood in descriptions.
- **Good**: `feat: add database migration for body fat logs`
- **Bad**: `feat: added database migration` / `feat: adding database migration`

---

## 3. Versioning & Release Guidelines

FitdaysWeb adopts **Semantic Versioning 2.0.0** (MAJOR.MINOR.PATCH).

### Version Source of Truth
The version is centrally defined in the root `VERSION` file.
Before cutting a release, the version must be updated in:
- `VERSION` at the repository root
- `backend/pyproject.toml` (`version = "..."` under `[project]`)
- `frontend/package.json` (`"version": "..."`)

### How to Bump the Version
A script is provided to update all three files synchronously. Run the following command from the repository root:
```bash
python scripts/bump_version.py <new_version>
```
Example:
```bash
python scripts/bump_version.py 1.2.0
```
Commit the updated files (`VERSION`, `backend/pyproject.toml`, and `frontend/package.json`) to your release PR.

### Tagging & Publishing
When a release branch or merge commit containing a version bump is merged, create a Git tag `vX.Y.Z` and publish a GitHub Release.
Our GitHub Actions will automatically:
- Trigger the **Release** pipeline to build and publish the backend and frontend Docker images to GitHub Packages (GHCR) tagged with the version and `latest`.
- Draft a GitHub Release containing release notes categorized automatically by PR labels/titles.
