# rovers.sg

Express 5 + Handlebars site for Singapore Rovers: public pages, an events calendar, photos,
resources and a link shortener, with one admin account that manages the content. Data is in
NeDB files under `database/`; uploads go to `public/uploads/` (photos) and outside `public/`
(resource files). The site is deployed on Render from `main`.

## Run and check

- Node: the version in `.node-version` (also the `engines` floor in `package.json`).
- `npm ci --engine-strict`, then copy `.env.example` to `.env` and set `SESSION_SECRET`
  (32+ characters), `ADMIN_USERNAME` and `ADMIN_PASSWORD`. `npm start` (or `npm run dev`).
- **Gate** (what CI runs; all must pass before a PR is ready):

  ```sh
  npm ci --engine-strict && npm run lint && npm run format:check && npm test && npm audit --omit=dev
  ```

- `npm test` boots the real `node app.js` in a temporary copy of the repo (your `database/` and
  uploads are never touched) and drives it over HTTP with a cookie-jar client that scrapes the
  CSRF token (`test/helpers/app.js`). No network is needed.

## Where things live

- `app.js`: startup, secret check, admin bootstrap.
- `controllers/config.js`: middleware (helmet, sessions, passport, CSRF, uploads, rate limit).
- `controllers/routes.js`: top-level routes, 404 and 500 handlers; one file per area beside it.
- `controllers/settings.js`: constants (time formats, size limits, mailing form URL).
- `models/`: NeDB access. `middlewares/`: auth, admin, uploads, flash messages.
- `views/`: Handlebars templates. `public/`: static files and vendored client libraries.
- `test/`: `node:test` suites; `test/helpers/app.js` is the harness.
- `.github/workflows/ci.yml`: checks `test (floor)`, `test (lts)` and `audit` on every PR and
  push, weekly on Mondays; a failing scheduled run opens a "Scheduled CI failed" issue.

## Conventions

- Damian merges. Agents work on branches and open or update PRs; they never merge, close PRs,
  push to `main` or change repository or Render settings.
- One problem per commit, one theme per PR. Imperative, sentence-case subjects with no prefix,
  except dependency commits: `fix(deps): update <pkg> <old> -> <new> (GHSA-…)`.
- Commit bodies say what was wrong (citing the commit that caused it), the fix, and how it was
  verified: the result before and after. A behavioural fix adds a test that fails before it.
- Don't force-push a pushed branch; add commits, and merge the base in to update it.
- Stacked PRs say so in the description and give the merge order.
- Dependabot PRs are merged by hand after CI (no auto-merge: merging deploys).
- Known gaps are `test.todo` entries in `test/baseline.test.js`. Fixing one means dropping
  `.todo` in the same PR.

## Decided against (don't re-propose)

- npm's audit "fix" for the dev-only eslint/minimatch advisory.
- Migrating NeDB to SQLite or another database. There is no data worth migrating.
- Turning on a strict Content-Security-Policy as a side effect of another fix. It needs its
  own PR, after inline scripts move into files.

## Known issues (don't re-investigate)

- Sessions use an in-memory store (memorystore), so a restart signs everyone out.
- The sign-in limiter is mounted with `app.use`, so page loads of `/users/signin` count toward it.
- A CSRF token in the query string (`?_csrf=`) is accepted.
- The error handler is inside the router, so errors raised before it (such as a CSRF failure)
  get Express's default error page, which shows the stack trace outside production.
- `trust proxy` is hard-coded to 1 (one proxy hop, as on Render).
- The footer's mailing-list sign-up posts to a Google Form; the URL is a constant in
  `controllers/settings.js`.
- Render's free tier wipes the disk on every restart, so the demo loses its content.
