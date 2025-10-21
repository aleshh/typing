# Repository Guidelines

This repository hosts a Vite + React + TypeScript typing trainer focused on numbers and symbols. It generates code‑like snippets, tracks per‑character performance in LocalStorage, and adapts future sprints to emphasize trouble characters.

## Overview (What’s Implemented)
- Screens: Welcome (settings), Typing (sprint), Progress (history + trouble chars).
- Generator: punctuation‑heavy snippets, weights numbers/symbols and boosts weak characters.
- Metrics & Data: net/gross WPM, accuracy, errors, time; per‑char attempts/errors; all stored in LocalStorage.
- UX: dark theme, progress bar, live HUD, pause (Esc), backspace enabled.

## Run & Develop
- Install: `npm install`
- Dev: `npm run dev` (open printed localhost URL)
- Build/Preview: `npm run build`, `npm run preview`
- Key files: `src/screens/*`, `src/generator.ts`, `src/store.ts`, `src/config.ts`, `src/types.ts`, `src/styles.css`, `vite.config.ts`, `index.html`.

## Project Structure
```
src/
  screens/            # Welcome, Typing, Progress
  generator.ts        # Punctuation‑heavy snippet generation
  store.ts            # LocalStorage + stats helpers
  config.ts           # Defaults (e.g., sprintLength: 300)
  types.ts            # Shared types
  styles.css          # Theme and components
```

## Build, Test, and Commands
- `npm run dev`: start Vite dev server.
- `npm run build`: production build.
- `npm run preview`: preview built app.
(When tests are added, mirror `src/` in `tests/` and use `*.test.ts(x)`.)

## Coding Style & Naming
- TypeScript strict mode; React 18 function components.
- Indentation 2–4 spaces; aim for ~100 col width.
- Components `PascalCase`; utilities `kebab-case`/`snake_case` as appropriate.

## Testing Guidelines
- Prioritize generator and metrics logic; Arrange‑Act‑Assert style.
- Name tests `*.test.ts` / `*.test.tsx`; use Vitest/Jest once configured.

## Commit & PR Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
- PRs: clear description, linked issues (`Closes #123`), screenshots/logs for UI changes.

## Configuration & Data
- `src/config.ts`: `sprintLength` (default 300), `weights`, `emphasizeTrouble`.
- LocalStorage: session results, per‑char stats, and config (`src/store.ts`).

## Pending Decisions
- Theme: dark/light/auto.
- Corrections: any penalty for backspace, or none.
- Display: show net vs gross WPM by default.
- Snippet scope: include Tab/Enter and specific symbol sets.

## Suggested Next Features
- Keyboard heatmap overlay; difficulty presets and custom char sets.
- Optional backspace penalty; stricter/relaxed modes.
- Focus tools: countdown, subtle error feedback, ambient sound.
- Goals/streaks; export/import progress; multi‑profile support.
- Per‑character drills that isolate top trouble symbols.

