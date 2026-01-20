# AGENTS.md

This file provides repo-specific guidance for coding agents.
Keep changes focused and consistent with existing patterns.

## Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Tests: `npm test`
- There is no built-in single-test command.
- If you add tests, add scripts in `package.json`.
- Prefer running the smallest scope command first.
- Vite is the build tool.
- SolidJS is the UI framework.
- Tailwind v4 is used for styling.
- PWA is handled via `vite-plugin-pwa`.

## Testing & Linting
- Vitest is configured for sanity checks (node environment).
- No ESLint/Prettier configuration found.
- Avoid adding new tooling unless requested.
- Single test: `npx vitest run --environment node tests/calculator.test.js`
- When verifying changes, use `npm run build`.
- Avoid `npm run dev` unless explicitly requested; agents cannot view UI output.
- Keep checks fast and targeted.

## Product Context
- 5/3/1 calculator PWA with mobile-first, offline-capable UI.
- Data is client-only in IndexedDB; no backend services.
- Dark monochrome visual style; avoid bright accent colors.
- Week 4 is deload and hides warmups/supplemental work.
- Week schemes and rounding live in `src/calculator.js`.

## Project Layout
- `src/main.jsx` bootstraps Solid and registers service worker.
- `src/store.js` owns state, persistence, and domain operations.
- `src/db.js` wraps IndexedDB and defaults.
- `src/calculator.js` contains 5/3/1 math helpers.
- `src/templates.js` defines training templates.
- `src/components/` holds UI components (PascalCase filenames).
- `src/hooks/` holds Solid hooks (camelCase `use*` files).
- `src/style.css` hosts Tailwind directives and theme tokens.
- `vite.config.js` configures plugins and PWA manifest.
- `public/` hosts icons referenced by the PWA manifest.

## Imports & Modules
- Use ES modules everywhere.
- Include explicit file extensions in relative imports.
- Prefer relative imports within `src/`.
- Keep import groups ordered: external, internal, styles.
- Use named imports for Solid helpers.
- Use default exports for components.
- Use named exports for utilities and store functions.
- Avoid circular dependencies between store, hooks, and components.
- Keep imports at top of file, no dynamic imports unless needed.

## Formatting
- Indent with 2 spaces.
- Use single quotes for strings.
- Omit semicolons.
- Keep lines reasonably short for readability.
- Avoid trailing commas unless already present nearby.
- Leave a blank line between logical sections.
- Use block comments for module headers.
- Use JSDoc-style comments for exported helpers.
- Prefer `const` with reassignment only when needed.

## Naming
- Components: `PascalCase` function names and filenames.
- Hooks: `useSomething` naming and camelCase filenames.
- Variables and functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- IDs and keys: short, descriptive, stable strings.
- Event handlers: prefix with `handle`.
- Derived signals: prefix with `get` or `is` when boolean.

## SolidJS Components
- Components are `export default function Name()`.
- Use Solid control flow (`<Show>`, `<For>`).
- Use `class` instead of `className` in JSX.
- Prefer local helper functions over inline logic.
- Use `onMount` for side effects.
- Use `createSignal` for local state.
- Avoid direct DOM access unless required.
- Keep props simple and documented via usage.

## Hooks
- Hooks live in `src/hooks/`.
- Export signals and functions explicitly.
- Keep hooks side-effect free unless purpose-built.
- Use `createSignal` for reactive state.
- Clean up timers and listeners.
- Encapsulate platform APIs (wake lock, orientation).

## State & Persistence
- Central state is in `src/store.js`.
- Access state via `state` store and helper functions.
- Update persistent state through `updateSettings`, `updateLift`, etc.
- Avoid mutating store objects directly.
- IndexedDB writes must strip Solid proxies.
- Use `JSON.parse(JSON.stringify(...))` when persisting.
- Keep schema changes in `DEFAULT_DATA`.
- Merge defaults when loading persisted data.
- Guard against missing data with optional chaining.
- Keep computed values in selectors (e.g., `getLiftData`).
- Use `async`/`await` for DB operations.

## Error Handling
- Prefer `try/catch` around JSON parsing and async imports.
- Return `{ success, error }` objects for import/export flows.
- Use early returns for invalid input.
- Keep user-facing error strings short and specific.
- Swallow non-critical failures (e.g., service worker registration).
- Avoid throwing from UI components.
- Guard optional data with `?.` and `??` defaults.

## Tailwind & Styling
- Styling is Tailwind v4 + CSS variables.
- Use Tailwind utility classes for layout and spacing.
- Keep class lists ordered logically (layout → spacing → color).
- Avoid inline styles unless required.
- Update `src/style.css` for theme tokens or base styles.
- Prefer existing design tokens (`bg-bg`, `text-text-muted`).

## PWA & Assets
- Service worker registration lives in `src/main.jsx`.
- PWA config is in `vite.config.js`.
- Update `vite.config.js` when changing icons or manifest.
- Keep asset additions in `public/` consistent with manifest.

## Cursor/Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or Copilot instructions found.
- If new rules are added, mirror them here.

## When Adding Features
- Keep UI changes in components and state in store.
- Prefer small, focused commits (if requested).
- Avoid refactors unrelated to the task.
- Update defaults and migrations together.
- Ensure new UI paths handle deload week logic.
- Keep calculations in `src/calculator.js`.
- Keep template logic in `src/templates.js`.

## When Fixing Bugs
- Reproduce with `npm run dev` if needed.
- Add guardrails near the source of the bug.
- Keep fixes minimal and aligned with existing patterns.

## Notes
- This repo is JavaScript-only; no TypeScript.
- Prefer `const` and use `let` only when needed.
- Use browser APIs directly when Solid doesn't provide helpers.
- Ensure optional settings have safe defaults.
- Avoid adding new dependencies without discussion.
- Do not persist session-only UI state.
