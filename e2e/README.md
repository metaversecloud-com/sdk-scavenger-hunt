# End-to-end tests

Playwright tests that drive the real app (production build of `client/` + `server/`) in a browser.
The server's `@rtsdk/topia` calls go to `mock-topia/server.mjs`, an in-memory fake of the Topia public
API, so no Topia credentials, world or network access are needed. The PR check (`E2E`) runs them on
every push; see `.github/workflows/e2e.yml` (managed by Terraform in config_texts).

## Run

```bash
npm install                      # app deps, repo root
cd e2e
npm install
npx playwright install chromium
npm test                         # builds the app, starts the mock + app, runs all specs
npm run test:ui                  # interactive mode
```

Against the Docker image instead of local Node (what ships; needs Docker):

```bash
e2e/scripts/test-image.sh        # image exactly as the Dockerfile builds it
e2e/scripts/test-image.sh 24     # --build-arg NODE_VERSION=24, fails unless the image runs Node 24
```

Ports: app `3100`, mock `3101` (override with `APP_PORT` / `MOCK_TOPIA_PORT`).

Admin image uploads go to a fake S3 bucket in the mock (`AWS_ENDPOINT_URL_S3`, path-style), Google
Sheets logging is off, and the browser can only reach localhost, so nothing leaves the machine.

## Layout

| Path | What it is | When forking into a new app |
|---|---|---|
| `tests/platform/` | Checks every SDK app must pass: health endpoint contract, app shell fallback, credential checks, the interactive secret never reaching the browser | Keep identical; only edit `app.config.ts` |
| `app.config.ts` | The app's credentialed API routes, their known bugs, the entry page and the app shell marker | List every route that calls `getCredentials`; set `APP_SHELL_MARKER` if the page isn't a React root |
| `tests/app/` | Tests for the boilerplate's example page | Replace with tests for the app's own pages and rules |
| `fixtures.ts` | `world.seed({...})` builds one isolated Topia world per test; `world.url()` / `world.api()` add the session credentials Topia appends | Extend `seed` for the app's data objects |
| `mock-topia/server.mjs` | Fake Topia public API. Like the real one, world routes reject calls with neither an API key nor an interactive JWT carrying a nonce | Add routes for any endpoint the app calls that isn't there |

Every test gets its own world, so the suite runs fully in parallel. Each test also fails if the app
calls a public-API endpoint the mock doesn't implement, so an `@rtsdk/topia` upgrade that starts using
new endpoints can't pass silently. A full app example lives in sdk-quiz (`e2e/tests`).

## Known bugs

Tests for bugs that still exist are marked `test.fail(...)`: they pass while the bug is there and
fail with "Expected to fail, but passed" once it's fixed, so the marker is removed in the same change
as the fix. In `tests/platform/` the markers come from `knownBugs` on each route in `app.config.ts`
(and `ENTRY_PAGE_KNOWN_BUGS` for the page load), so the specs stay identical across apps.

| Test | Bug | Fix |
|---|---|---|
| `platform/credentials.spec.ts` "names the credential problem" (`unnamedCredentialError`, all routes) | `getCredentials` throws, but `errorHandler` sends the `Error` (serialized as `{}`) with a generic message. | Send `error.message`. EXP-439 #8. |
| `app/security.spec.ts` "admin endpoints reject players" (9) | No admin route checks `visitor.isAdmin`. | EXP-439 #1. |
| `app/security.spec.ts` "the challenge sent to players doesn't include the answer" | `GET /api/challenge` returns `answer` / `correctAnswers`. | EXP-439 #2. |
| `app/security.spec.ts` "can't be answered before every item is found", "empty answer", "answering again" | `/api/answer-challenge` doesn't check `cluesFound`, `challengeDone` or an unconfigured question. | EXP-439 #3. |
| `app/security.spec.ts` "remove-clue only removes items" | `/api/remove-clue` deletes any asset id. | EXP-439 #4. |
| `app/admin.spec.ts` "Reset Items rebuilds the list" | Reset searches `undefined_<theme>_clue` and saves `clues: {}`. | EXP-439 #5. |
| `app/player.spec.ts` "an item that can't be loaded shows an error" | `/clue` page shows the loader until `cluesFound` is set. | EXP-439 #6. |
| `app/player.spec.ts` "older progress keys are migrated" | The old `{urlSlug}-{sceneDropId}` key is never removed. | EXP-439 #7. |
| `app/player.spec.ts` "restarting ... shows the hunt again" | `/api/restart-challenge` answers `totalClues: 0`. | EXP-367 #1. |

The platform secret tests pass: no response carries SDK objects or the secret today, although the
`cleanReturnPayload` scrubber is still registered after the routes (EXP-429).

## Conventions

- New tests are mutation-checked: break the behavior in the app and confirm the test goes red.
- Before merging, `npx playwright test --repeat-each=3` must pass every time.
