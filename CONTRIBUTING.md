# Contributing to Recomp Pro

Thank you for contributing! 

## Local Development Setup

1. **Install Node.js 22**
2. **Install dependencies**: `npm install`
3. **Database**: A local SQLite file `fitdays.db` will be created automatically.
4. **Run development server**: `npm run dev`

## Verification Checks

Before opening a Pull Request, you **must** ensure all local checks pass:

1. **Linting**:
   ```bash
   npm run lint
   ```
2. **Unit Tests**:
   ```bash
   npm test
   ```
3. **Production Build**:
   ```bash
   npm run build
   ```

## Commit Convention

All commits must follow Conventional Commits (e.g., `feat: add chart`, `fix: correct typo`).

## Release Process

We use an npm script to bump the version across all files:
```bash
npm run version:bump 0.4.0
```
