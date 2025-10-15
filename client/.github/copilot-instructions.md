## Quick guide for AI coding agents working on Okuri (client)

Purpose: short, actionable notes to help an AI agent be productive in this Next.js + TypeScript client.

-   Project type: Next.js (App Router) + React 19 + TypeScript. Root app is in `app/` and global providers are wired in `app/layout.tsx`.
-   Data & auth: uses Supabase for auth/session and a separate backend API. Supabase clients live in `lib/util/supabase/client.ts` (browser & SSR helpers).
-   Backend URL: the client calls the backend with `api()` from `lib/util/utils.ts` which reads `process.env.NEXT_PUBLIC_API_URL`. Ensure environment variables are set for local runs.

Key patterns and files to reference:

-   app/layout.tsx — top-level providers: `ThemeProvider`, `AuthProvider` (`components/provider/auth-context.tsx`), `QueryClientProvider` and a small store wrapper. Use this when adding global providers or changing auth flows.
-   components/provider/auth-context.tsx — central place for Supabase client (browser) and auth state. Many hooks/components call `useAuth()` to get `session` and `client`.
-   lib/util/supabase/client.ts — createBrowserClient and createSSRClient helpers. Use `createSSRClient()` in server routes (see `app/api/auth/token/callback/route.ts`).
-   controllers (controller/\*.ts) — thin client-side fetch wrappers for the backend API (e.g., `controller/client.controller.ts`, `controller/user.controller.ts`). Prefer adding/updating logic here for API integrations; UI components use these controllers or hooks that call them.
-   hooks/\* — react-query hooks wrap controller calls (e.g., `hooks/useProfile.tsx` uses `fetchSessionUser` + `react-query`). Follow their retry/staleTime patterns when creating new hooks.

Conventions & developer workflows:

-   Scripts: use `npm run dev` / `npm run build` / `npm run start`. Lint with `npm run lint`.
-   Type generation: `npm run types` calls `openapi-typescript` against the API docs at `http://localhost:8081/docs/v3/api-docs` and writes to `lib/types/types.ts`. Run the backend locally or mock the docs endpoint before running this.
-   Environment variables required locally: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Missing `NEXT_PUBLIC_API_URL` will throw in `lib/util/utils.ts`.
-   Auth flow: OAuth code exchange is handled in `app/api/auth/token/callback/route.ts` using `createSSRClient().auth.exchangeCodeForSession(code)`. Avoid open-redirects — follow the `next` sanitization used there.

Code/style patterns to follow (specific, discoverable):

-   Error handling: controllers consistently use `fromError` / `isResponseError` found in `lib/util/error/error.util` to normalise errors. Use the same utilities when adding new fetch logic.
-   UUID validation: `lib/util/utils.ts` provides `isUUID()` used in controllers to validate path params.
-   React-query usage: Query keys include resource name + id (e.g., `['userProfile', session?.user.id]`). Hooks commonly set `enabled` based on session and set `staleTime` explicitly.
-   Stores: lightweight zustand stores are created under `stores/organisation/` and provided through `components/provider/OrganisationContext.tsx`. Use `useOrganisationStore(selector)` to read/write.

Integration points & external deps:

-   Supabase (auth and session management) — `@supabase/ssr` + `@supabase/supabase-js`.
-   Backend API — calls to `${api()}/v1/*` endpoints protected by Bearer tokens from Supabase session.access_token.
-   React-query — used for client caching and fetch orchestration.
-   TailwindCSS + Radix UI + Recharts + DnD-kit for UI components and interactions.

When making changes, prefer these locations:

-   API call changes: `controller/*.ts` (not inside UI components).
-   Types from backend: regenerate `lib/types/types.ts` via `npm run types` after updating backend OpenAPI.
-   Global state/auth changes: `components/provider/*` (auth, theme, organisation store).

Examples to cite in edits:

-   Add a new protected fetch helper: copy pattern from `controller/user.controller.ts` (check session, call `api()`, parse response, wrap/throw `fromError`).
-   Add SSR Supabase usage in server routes: follow `app/api/auth/token/callback/route.ts` and `lib/util/supabase/client.ts`.

Quick checks for PRs from an AI agent:

-   Ensure any new fetch uses `session?.access_token` and throws a `NO_SESSION` ResponseError if missing.
-   Confirm `NEXT_PUBLIC_API_URL` usage — don't hardcode base URLs. Use `api()` util.
-   Follow existing naming of query keys and `staleTime` values when adding react-query hooks.

If unclear or missing context:

-   Ask the maintainer for the local backend startup command or the OpenAPI docs endpoint if you need to run `npm run types` (the client expects the docs at port 8081).
-   Confirm expected auth cookie/load-balancer headers when changing `app/api/auth/token/callback/route.ts` logic.

End of instructions. Reply with areas you want expanded or specific tasks to implement.
