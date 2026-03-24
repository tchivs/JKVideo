# JKVideo Agent Guide

This repository is a React Native + Expo app.
Agents should optimize for small, safe changes and preserve existing patterns.

## Quick facts

- App entry: `expo-router/entry`
- Package manager: npm (lockfile present: `package-lock.json`)
- Language: TypeScript (`strict: true`)
- Primary UI stack: React Native + Expo
- State management: Zustand
- Networking: Axios
- Web support uses a local proxy for Bilibili endpoints
- Android TV build is a separate compilation via `APP_VARIANT=tv`

## Repo instructions already present

- `CONTRIBUTING.md` is the main human-facing policy file.
- `.claude/commands/add-doc.md` exists and instructs adding concise Chinese comments above each line when asked to document code.
- No `.cursor/rules/*`, `.cursorrules`, or `.github/copilot-instructions.md` files were found.

## Install / setup

```bash
npm install
```

Use the Expo commands below for development.

## Build / run commands

```bash
npm run start       # expo start
npm run android     # expo run:android
npm run ios         # expo run:ios
npm run web         # expo start --web
npm run proxy       # node dev-proxy.js
npm run start:tv    # APP_VARIANT=tv expo start
npm run build:tv    # APP_VARIANT=tv expo run:android
npm run prebuild:tv # APP_VARIANT=tv expo prebuild -p android --no-install
```

### What each command is for

- `start`: Expo dev server for local development / Expo Go.
- `android`: Native Android dev build.
- `ios`: Native iOS dev build.
- `web`: Web build/runtime through Expo.
- `proxy`: Local image/API proxy on port 3001 for web.
- `start:tv`: Expo dev server for TV variant.
- `build:tv`: Native Android TV build (separate package: `com.anonymous.jkvideo.tv`).
- `prebuild:tv`: Generate TV android native directory with Leanback manifest.

## Test / lint / type-check commands

### Current state

- No test framework is configured.
- No `test` script exists in `package.json`.
- No lint script or ESLint/Prettier config was found.
- No single-test runner exists yet.

### Practical guidance

- If you need static verification, use TypeScript checks manually:

```bash
npx tsc --noEmit
```

- If you add tests in the future, document the exact file-level invocation in `package.json` and update this file.
- Until then, there is no repository-defined command for running one test file or one test case.

## Code style

### Imports

- Prefer `import type` for type-only imports.
- Keep imports grouped by source:
  - external packages
  - internal services/utils/store/hooks/components
- Preserve local file style when touching older files.

### Formatting

- Use the existing indentation and spacing style in the file you edit.
- The repo mixes quote styles in existing files; do not mass-convert quotes.
- Prefer readable object literals and multiline props when JSX gets dense.
- Keep style objects at the bottom of component files when that pattern already exists.

### TypeScript

- Keep `strict` typing in mind; do not weaken types to make errors disappear.
- Prefer explicit return types on exported functions.
- Use interfaces / type aliases with PascalCase names.
- Prefer narrow types over `any`; avoid `as any`, `@ts-ignore`, and `@ts-expect-error`.
- Localized `any` appears in some API parsing code, but new code should avoid spreading it.

### Naming

- Components: `PascalCase`.
- Hooks: `useSomething`.
- Functions and variables: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` or clear constant-style names already used in the file.
- File names generally match the exported feature name (`VideoCard.tsx`, `bilibili.ts`, etc.).

### React / React Native patterns

- Prefer functional components.
- Use `React.memo` for reusable list items / cards when the pattern already fits.
- Keep derived values close to use sites.
- Use `StyleSheet.create` for component styles.
- Keep UI state in Zustand stores when the repo already does so.

### Error handling

- Use `try/catch` for network and platform-sensitive work.
- Return safe fallback values when failures are non-fatal.
- Re-throw or surface meaningful errors when the operation is required.
- Do not leave empty catch blocks.

### Data / API handling

- Bilibili API work belongs in `services/bilibili.ts` or closely related service files.
- Keep platform-specific logic explicit (`Platform.OS === 'web'`, `android`, etc.).
- Preserve web proxy behavior when touching request headers or media URLs.

## Documentation / contribution conventions

- `README.md` is Chinese-first and describes architecture, quick start, and limitations.
- `CONTRIBUTING.md` requires Conventional Commits.
- Commit types documented there: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `perf`.
- Never hardcode sensitive account data such as `SESSDATA` or user IDs.

## When editing files

- Make the smallest change that solves the problem.
- Match the surrounding code style instead of normalizing the whole file.
- Prefer existing utilities over introducing new dependencies.
- Avoid broad refactors unless the task explicitly asks for them.

## Useful repository hotspots

- `app/` — phone screens and layouts
- `app-tv/` — TV screens and layouts (separate build via `APP_VARIANT=tv`)
- `components/` — reusable UI (shared)
- `components/tv/` — TV-specific components (TVFocusable, TVVideoPlayer, etc.)
- `hooks/` — data-fetching and state hooks (shared)
- `services/` — API layer (shared)
- `store/` — Zustand stores (shared)
- `utils/` — helper functions (shared)
- `plugins/withAndroidTV.js` — Expo config plugin for Leanback manifest injection

## Validation checklist

- Confirm the app still starts with the relevant Expo command.
- If you changed TypeScript code, run `npx tsc --noEmit` when practical.
- If you changed web proxy behavior, test `npm run web` plus the proxy.
- If you changed native-only code, test on the relevant platform build.
- If you changed TV code (`app-tv/` or `components/tv/`), run `npm run prebuild:tv` and test on TV.
- TV and phone builds are fully independent — changes to `app-tv/` do not affect `app/`.
