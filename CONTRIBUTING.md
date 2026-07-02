# Contributing to Yumo Yumo

Yumo Yumo is currently in MVP stabilization. Contributions should preserve the existing product loop: receipt processing, reward accounting, hidden-cost insight, Yumbie, localization, and user data boundaries.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Use the environment template in `docs/env-template.md` to create a local `.env.local` file, then fill only the values needed for the area you are testing:

```bash
$EDITOR .env.local
```

3. Run the app:

```bash
npm run dev
```

## Checks

Run focused checks before opening a pull request:

```bash
npm run lint
npm run test
```

For database or hidden-cost work, also run the relevant script from `package.json`, such as `npm run migrate:status` or `npm run verify:hidden-cost`.

## Contribution Rules

- Keep changes scoped to the user-facing flow or system boundary being changed.
- Use real backend data. When data is missing, show an empty or explanatory state.
- Keep user-facing copy localized through `messages/`; English is the source language.
- Keep operational thresholds, anti-abuse parameters, provider routing, and security calibration out of public documentation.
- Commit source, tests, migrations, and public documentation. Keep secrets, local environment files, generated build output, and private operational notes outside the repository.

## Public Mirror

The public mirror excludes selected internal paths that contain operational controls, anti-abuse logic, data-calibration code, or private runbooks. Public grant reviewers should use the technical paper, README, migrations, reward engine, verifier code, and selected API surfaces to evaluate the architecture without exposing bypassable production details.
