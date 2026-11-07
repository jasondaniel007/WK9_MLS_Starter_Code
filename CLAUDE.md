# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ThreadHive is a Reddit-style forum app (subreddits → threads → comments, with voting and auth) split into two independent npm packages with no shared root tooling:

- `threadhive-backend/` — Express 5 + Mongoose REST API
- `threadhive-frontend/` — React 19 + Vite + Redux Toolkit SPA

Each has its own `package.json`, test runner, and must be worked on from within its own directory (`cd threadhive-backend` or `cd threadhive-frontend` first).

## Commands

### Backend (`threadhive-backend/`)
- `npm run dev` — start with nodemon (auto-restart)
- `npm start` — start once (`node main.js`)
- `npm test` — run all tests (vitest, uses an in-memory MongoDB, see below)
- `npx vitest run tests/unit/services/threadService.test.js` — run a single test file
- `npx vitest run -t "test name"` — run tests matching a name
- `npm run populate` — wipe the DB configured by `MONGODB_URI` and reseed it from `src/scripts/seed-data.js`
- `npm run format` — Prettier write, whole package

Backend tests run with `fileParallelism: false` (see `vitest.config.js`) because integration tests share one in-memory Mongo instance via `tests/setup.js` — do not parallelize them.

### Frontend (`threadhive-frontend/`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — run all tests (vitest + jsdom)
- `npx vitest run tests/unit/components/ThreadCard.test.jsx` — run a single test file
- `npm run test:ui` — vitest UI runner
- `npm run test:coverage` — coverage report

## Environment

Backend requires a `.env` (see `.env.example`): `MONGODB_URI`, `PORT`, `JWT_SECRET`, `JWT_EXPIRATION`, `NODE_ENV`, `GEMINI_API_KEY`. `GEMINI_API_KEY` powers the AI features (see "AI features" below).

The frontend has no `.env`; the API base URL is hardcoded in `threadhive-frontend/src/api/axiosInstance.js` as `http://localhost:3000/api`. If the backend's `PORT` changes, update it there.

## Backend architecture

Strict layered flow for every resource (threads, comments, subreddits, votes, auth): **route → middleware → controller → service → model**.

- `src/routes/*.js` — wires URL + HTTP verb to a controller, applies `authHandler` middleware per-route (not globally). Note `src/routes/votes.js` mounts thread/comment vote endpoints under the shared `/api` prefix (`app.use("/api", voteRoutes)` in `src/app.js`), not under `/api/votes`.
- `src/controllers/*.js` — parses `req`, calls into one or more services, shapes the HTTP response as `{ success, message, data }`. Controllers do **not** wrap calls in try/catch — Express 5 forwards rejected async handler promises to `next()` automatically, which lands in `src/middleware/errorHandler.js`.
- `src/services/*.js` — all Mongoose queries and business logic live here, never in controllers. Not-found/validation failures throw via `createAppError(message, statusCode)` (`src/utils/createAppError.js`), which attaches `statusCode` to a normal `Error` for the error handler to read.
- `src/models/*.js` — Mongoose schemas. `Thread` and `Comment` track votes via `upvotedBy`/`downvotedBy` ObjectId arrays plus a denormalized `voteCount`, not just a counter — vote services must update both the array and the count together.
- `src/middleware/authHandler.js` — expects `Authorization: Bearer <jwt>`, verifies with `JWT_SECRET`, loads the user, and sets `req.user = { userId }` (not the full user doc).
- App construction (`src/app.js`) vs. process lifecycle (`server.js`, `main.js`, `db.js`) are deliberately split: `app.js` is the testable Express app (imported directly by Supertest in integration tests, no network/DB needed to import it), `server.js`/`db.js` own the actual HTTP listener and Mongoose connection, and `main.js` is the process entrypoint that sequences `connectToDB()` → `startServer()`.
- `src/scripts/populate_db.js` + `seed-data.js` are a standalone seeding script (own DB connect/disconnect), not part of the app runtime.

## Frontend architecture

- **State**: Redux Toolkit, one slice per domain in `src/reducers/` (`authSlice`, `threadListSlice`, `currentThreadSlice`, `commentSlice`, `subredditSlice`, `themeSlice`), combined in `src/store/store.js`. Async work goes through `createAsyncThunk`, which calls into `src/services/*.js` and wraps errors with `src/utils/handleApiError.js`.
- **API layer**: `src/api/axiosInstance.js` is the single configured Axios client; `src/config/apiConfig.js` centralizes every endpoint path/builder (e.g. `THREAD_API.GET_BY_ID(id)`). Services in `src/services/*.js` compose these two plus manual `Authorization: Bearer <token>` headers read from `localStorage` on every call — there is no Axios interceptor for auth.
- **Auth/session**: JWT is stored in `localStorage` (`token`, `user`) and mirrored into `authSlice`. `handleApiError` hard-redirects to `/login` and clears `localStorage` on any 401 — centralized session-expiry handling, not per-component.
- Route protection: `src/components/PrivateRoute/PrivateRoute.jsx` reads `state.auth.token` and redirects to `/login` if absent; wrap protected pages in `src/App.jsx` with it rather than checking auth ad hoc in pages.
- Components are grouped by feature under `src/components/<Feature>/` (co-located `.jsx` + `.css` per component); `src/components/Shared/` holds cross-feature widgets (`VoteButtons`, `FilterSortBar`, `PaginationComponent`).

## Testing conventions

- Backend integration tests (`tests/integration/*.test.js`) spin up the real `src/app.js` against an in-memory Mongo (`mongodb-memory-server`) via `tests/setup.js`'s global `beforeAll`/`afterAll` — no mocking of Mongoose.
- Backend unit tests (`tests/unit/**`) mirror `src/`'s folder structure 1:1 (`controllers/`, `services/`, `middleware/`, `utils/`) and mock the layer below.
- Frontend uses MSW (`tests/mocks/handlers.js`, `server.js`, `mockData.js`) to mock HTTP in both unit and integration tests rather than mocking service modules directly.
- Frontend `tests/unit/**` also mirrors `src/`'s structure (`components/`, `pages/`, `reducers/`, `store/`).

## AI features

Both features call Gemini from the **backend only** (never directly from the frontend). Requirements originate in `resources/prompts.md`.

- **Backend:** all Gemini logic is in `src/services/aiService.js` (`@google/genai`, model `gemini-3.8-flash`, `client.interactions.create(...)` → `output_text`). The client is built lazily inside `getClient()` on each call, after the key is read from `process.env` — never at module load, because ESM imports run before `main.js` calls `dotenv.config()`. Missing key → 500; Gemini failure or empty output → 502.
- **Summarize:** `POST /api/threads/:id/summarize` (`threadController.summarizeThread`). Frontend: `components/Summary/ThreadSummary.jsx` on `ThreadPage`, state in `currentThreadSlice` (`summary`, `summaryLoading`, `summaryError`, kept separate from the thread's `loading` so the page spinner isn't triggered).
- **Rephrase:** `POST /api/ai/rephrase` with `{ text, type: "title" | "body" | "comment" }` (`aiController.rephrase` validates; routes in `src/routes/ai.js`). Frontend: `components/Shared/RephraseButton.jsx`, used for the thread title and body in `CreateThreadForm` and for the comment box (`CommentForm` renders it only when the optional `onTextReplace` prop is passed). It uses local state and a direct call to `src/services/aiService.js` (no Redux), so each field has its own loading state. It shows the rewrite as a proposal and replaces text only on Accept; on failure the original text is untouched.
- **Testing:** backend tests mock `@google/genai` (no network); frontend tests use MSW (`*/ai/rephrase`, `/threads/:id/summarize`).
