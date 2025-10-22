# Typing Sprints

A small typing trainer focused on numbers and symbol keys, designed to feel like typing TypeScript code. It generates code‑like snippets with lots of number‑row characters and adapts to your weak characters over time.

- Live demo: https://projects.alesh.com/typing
- Stack: Vite + React + TypeScript

## Features
- TypeScript‑like snippets (imports, generics, classes, unions, etc.).
- Emphasis on number‑row symbols (`~` `` ` `` `!` `@` `#` `$` `%` `^` `&` `*` `(` `)` `_` `-` `+` `=`) with a tunable slider.
- Sprints with live WPM, accuracy, and error counts; pause/resume.
- Local progress screen showing recent runs and your top trouble characters.

## LocalStorage
Data is stored locally in your browser under these keys:
- `typing.results`: array of session results (timestamp, duration, length, WPM, accuracy, per‑session trouble chars).
- `typing.charStats`: cumulative per‑character attempts and errors used to emphasize difficult keys in future sprints.
- `typing.config`: your settings (sprint length, emphasis toggles, number‑row emphasis).

To reset progress, clear these keys (or all site data) in your browser’s storage tools.

## Develop
```
npm install
npm run dev
```
Open the printed localhost URL.

## Build
```
npm run build
npm run preview    # optional: preview the build locally
```
Artifacts are emitted to `dist/` with `index.html` and an `assets/` folder.

## Deploy
This project is configured to be hosted at a subpath:
- Current base: `/typing/` (see `vite.config.ts`).
- Deploy the contents of `dist/` to the folder served at `https://projects.alesh.com/typing` (keep `index.html` and `assets/` together).

Alternative hosting:
- If you want fully relative paths for “drop anywhere” hosting, build with a relative base:
  - One‑off: `npm run build -- --base ./`
  - Or set `base: './'` in `vite.config.ts`.

## Notes
- `.gitignore` ignores `node_modules/`, `dist/`, and `.DS_Store`.
- Styling lives in `src/styles.css`; main app in `src/App.tsx`; screens under `src/screens/`.
