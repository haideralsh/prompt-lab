# Repository Guidelines

## Project Structure & Module Organization

- Frontend (React + TypeScript, Vite): `src/`, entry `src/main.tsx`, styles `src/main.css`, UI under `src/components/`, shared types in `src/types/`, assets in `src/assets/`, static files in `public/`, HTML at `index.html`.
- Desktop shell (Tauri + Rust): `src-tauri/` with commands in `src-tauri/src/api/`, app entry in `src-tauri/src/main.rs` and `lib.rs`, models/errors in `src-tauri/src/*.rs`, config in `src-tauri/tauri.conf.json`, icons in `src-tauri/icons/`.

## Build, Test, and Development Commands

- `npm run dev` — Start Vite dev server (frontend only).
- `npm run preview` — Preview the built frontend locally.
- `npm run build` — Type-check (`tsc`) and build Vite output to `dist/`.
- `npm run tauri dev` — Run the desktop app (Tauri + frontend dev server).
- `npm run tauri build` — Build production desktop binaries using Tauri.

## Coding Style & Naming Conventions

- TypeScript/React: 2-space indent; components in PascalCase (e.g., `SidebarContent.tsx`); functions/variables in camelCase; constants in SCREAMING_SNAKE_CASE (see `src/constants.ts`).

## React best practices

- Always favor using handlers over useEffect. Effects should be reserved for synchronizing with external systems like APIs or browser features, not for transforming data or handling user interactions. Instead of using Effects, calculate derived values directly during rendering, cache expensive computations with useMemo, reset component state by changing the key prop, and handle user-triggered logic in event handlers where you know exactly what action occurred. For managing state between components, lift state up to the parent rather than synchronizing with Effects. The fundamental principle is that if your logic doesn't involve an external system, you likely don't need an Effect—most state management and UI updates can be handled through direct calculations, event handlers, or proper component architecture.

## Testing Guidelines

- No formal test suite is configured yet. Prefer small units and pure functions to enable future tests.
- Manual verification: use `npm run tauri dev` and verify flows (directory selection, tree search/selection, clipboard copy, git status/diff).
- Rust: add targeted `#[test]` modules near functions when contributing to `src-tauri/`.

## Commit & Pull Request Guidelines

- Commits: Imperative, concise subjects (e.g., "Add git status view"). Group related changes; keep diffs focused.
- PRs: Include summary, rationale, test/verification steps, and screenshots/GIFs for UI changes. Link issues where relevant. Avoid drive-by refactors.

## Security & Configuration Tips

- Tauri config: see `src-tauri/tauri.conf.json` (`beforeDevCommand`, `frontendDist`). Avoid weakening security defaults without discussion.
- No secrets should be committed; environment-specific items belong outside the repo.

## Agent-Specific Instructions

- Keep changes minimal and scoped; do not rename/move files unless asked.
- Match existing patterns (folder structure, naming). If a command or API changes, update both frontend and `src-tauri` call sites and configs.
