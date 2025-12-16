# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

### Install dependencies
```sh
npm install
```

### Run the app (Vite dev server)
```sh
npm run dev
```
- Vite dev server is configured for port `3000` in `vite.config.ts`.

### Build
```sh
npm run build
```
- Outputs production assets to `out/` (see `vite.config.ts`).

### Preview a production build locally
```sh
npm run preview
```

### Lint
```sh
npm run lint
```
- ESLint is configured in `eslint.config.ts`.

### Type-check
```sh
npm run type-check
```

### Tests
- There is no `test` script in `package.json` and no test runner config found in-repo.

## High-level architecture

### Runtime stack
- Vite + React + TypeScript.
- React Router (configured via `useRoutes` + route objects).
- TailwindCSS (see `tailwind.config.ts`, `src/index.css`).
- i18next for localization.
- Supabase for auth/data + invoking Edge Functions.

### App entrypoints
- `index.html` contains the `#root` mount.
- `src/main.tsx` bootstraps React and imports `src/i18n` and global CSS.
- `src/App.tsx` wires:
  - `I18nextProvider` (localization)
  - `BrowserRouter` (routing) using `basename={__BASE_PATH__}`

### Routing
- `src/router/config.tsx` is the canonical list of routes.
  - It lazily imports page components from `src/pages/**`.
  - Most pages follow the convention `src/pages/<route>/page.tsx`.
  - Some routes have nested folders (example: `src/pages/marketplace/all/page.tsx`).
- `src/router/index.ts` renders routes via `useRoutes(routes)`.
  - It also exposes the router navigate function globally as `window.REACT_APP_NAVIGATE` and resolves `navigatePromise` to enable imperative navigation from non-component code.

### Pages vs shared components
- Route-level components live under `src/pages/`.
  - Many pages keep page-specific UI under `src/pages/<page>/components/` and compose shared layout pieces.
- Reusable/shared UI lives under `src/components/` (notably `src/components/feature/*` for layout-level pieces like `Navbar`/`Footer`).

### Client-side state (no Redux)
This app uses lightweight singleton managers + hooks (backed by `localStorage`) for state that needs to survive navigation/refresh:
- `src/utils/sessionState.ts`
  - Tracks session/user context, preferences, and interaction history.
  - Exposes `useSessionState()`.
- `src/utils/cartState.ts`
  - Persists cart items and drives the cart badge/count.
  - Exposes `useCartCount()` and `useCartItems()`.

Higher-level “personalization/AI behavior” is implemented as pure TS modules that consult session state:
- `src/utils/personalizationEngine.ts`
- `src/utils/adaptiveAI.ts`

### Localization (i18n)
- `src/i18n/index.ts` initializes i18next + a browser language detector.
- Translation resources are loaded via a Vite glob in `src/i18n/local/index.ts`:
  - Add new translations under `src/i18n/local/<lang>/*.ts`.

### Supabase integration

#### Frontend client
- `src/lib/supabase.ts` creates the Supabase client using Vite env vars:
  - `VITE_PUBLIC_SUPABASE_URL`
  - `VITE_PUBLIC_SUPABASE_ANON_KEY`

#### Edge functions (server-side)
- Supabase Edge Functions live in `supabase/functions/<function-name>/index.ts` (Deno + `serve`).
- The frontend calls functions via `supabase.functions.invoke('<function-name>', { body: ... })` (example: marketplace checkout flow).
- Common function env vars referenced by the Edge Functions:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (used for webhooks/admin writes)
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (webhook verification)

### Build-time globals / config flags
- `vite.config.ts` defines compile-time constants and base path behavior:
  - `__BASE_PATH__` from `BASE_PATH` (defaults to `/`)
  - `__IS_PREVIEW__` from `IS_PREVIEW`
  - `__READDY_PROJECT_ID__` from `PROJECT_ID`
  - `__READDY_VERSION_ID__` from `VERSION_ID`
  - `__READDY_AI_DOMAIN__` from `READDY_AI_DOMAIN`

### Auto-imports
- Vite uses `unplugin-auto-import` (see `vite.config.ts`) to auto-import common React hooks/components and React Router helpers.
  - When editing files, be aware some hooks/components may be used without explicit `import` statements.