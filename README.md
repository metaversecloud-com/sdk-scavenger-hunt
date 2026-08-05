<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Scavenger Hunt

## Introduction / Summary

Scavenger Hunt is a Topia SDK app that turns a scene into a themed clue-collection game. A single **key asset** (`uniqueName = "ScavengerHunt"`) drives the scene: it holds the challenge, the clue catalog, the leaderboard, and (via its `theme`) the naming convention used to discover clue dropped assets. Visitors click clue assets scattered around the scene — each one opens the drawer at `/clue`, records the visit on the visitor's data object, and updates progress. Once every clue in the scene has been visited, the visitor answers a final challenge (text / multiple-choice / all-that-apply) back on the key asset. Correct answers grant a themed emote (via `visitor.grantExpression`), can trigger a `buildableAssetUniqueName` reward, fire toast + particle effects, and update the per-scene leaderboard stored on the key asset. Progress and answer attempts are tracked per-visitor and per-scene (`{urlSlug}_{sceneDropId}`) so a single visitor can play multiple scavenger hunts across worlds and have completions counted separately.

## Key Features

- **Themed clue hunts.** A single `theme` string on the key asset (`robot`, `space`, `bird`, `national-park`, `numbers`, `letters`, `hat`, etc. — 13 built-ins plus `custom`) drives the clue `uniqueName` pattern used to discover assets in the scene and the default start / title imagery.
- **Rich clue payloads.** Each clue can render an image, a video (iframe), or a full website inside the drawer, and can be configured to open in a `drawer`, `modal`, or new `tab`.
- **Three question types.** Final challenge supports free-text (case-insensitive match), single-answer multiple choice, and multi-select "all that apply".
- **Per-visitor progress + restart.** Progress lives at `visitor.dataObject[{urlSlug}_{sceneDropId}]` — `cluesFound`, `challengeDone`, `answerAttempts`. Restart clears these and removes the visitor's leaderboard row.
- **Leaderboard on the key asset.** `keyAsset.dataObject.leaderboard[profileId] = "displayName|cluesCollected|challengeDone|answerAttempts"`. Displayed to admins on the Results tab, sorted by completion then clues found.
- **Emote reward + effects.** Correct answers call `visitor.grantExpression` with the admin-selected emote (or a themed default `scavengerHunt-{theme}-1`), then fire an `explosion_float` particle and a toast. Discovering a new clue triggers a `disco_float` particle on the clue's position; finding the final clue triggers `partyPopper_float` on the visitor.
- **Badges from ecosystem inventory.** Five badges are auto-granted from cached ecosystem inventory: _Spark of Discovery_ (first clue), _Traveler_ (clues in 3 worlds), _Scout_ (25 total clues), _Quick Thinker_ (correct on first attempt), _Curious Mind_ (10 completions). See `server/controllers/handleAnswerChallenge.ts` and `handleGetClue.ts`.
- **Admin controls.** Add / update / remove / reset clues live from the drawer, walk-up to any configured clue, upload challenge images to S3, edit the final challenge, and pick the reward emote.
- **Base64 → S3 image uploads.** Admins upload challenge / clue images through `POST /uploads`; files are scoped under `userUploads/{interactivePublicKey}/{profileId}_{filename}` so uploaders can only see and delete their own.
- **Optional Google Sheets logging.** Completions are appended to a sheet when `GOOGLESHEETS_*` env vars are configured (silent no-op otherwise).
- **Inline legacy migration.** `getConfig` transparently migrates worlds that stored config at `world.dataObject.scenes.{sceneDropId}` onto the key asset's data object on first read, then collapses the world entry to `{ [sceneDropId]: { keyAssetId } }`.

## Required Assets with Unique Names

Clue dropped assets must all share the same `uniqueName`, following a naming convention derived from the key asset's `theme` (set once when the scene is authored).

| Unique Name                  | Placed by | Description                                                                                                                                                                                                                          |
| ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ScavengerHunt`              | Manually  | The key asset. Its data object stores `theme`, `challenge`, `clues`, `leaderboard`, and `buildableAssetUniqueName`. Required — one per scene.                                                                                        |
| `ScavengerHunt_{theme}_clue` | Either    | Every clue dropped asset in the scene. `{theme}` matches `keyAssetData.theme` (e.g. `ScavengerHunt_robot_clue`). Placed manually or via `POST /add-new-clue`.                                                                        |
| `{buildableAssetUniqueName}` | Manually  | Optional reward asset. If admin sets `buildableAssetUniqueName` on the challenge (freeform text — surfaced in the UI only when `theme === "national-park"`), that named asset can be leveraged as a completion reward. Not required. |

### Built-in themes

`national-park`, `robot`, `space`, `bird`, `recycle`, `book`, `numbers`, `numbers-yellow`, `numbers-blue`, `numbers-purple`, `letters`, `hat`, `custom`. Defined in [`client/src/context/themeData.ts`](client/src/context/themeData.ts) — each entry supplies the default `challengeTitleImgUrl` and how many pre-designed clue assets exist in the admin section.

## Technical Architecture

### Data Objects

#### World

Post-migration, the world's data object only carries a lightweight per-scene index:

```ts
{
  [sceneDropId]: { keyAssetId: string };
  scenes?: { ... }; // legacy — auto-migrated onto the key asset on first read
}
```

#### Key Asset (`uniqueName = "ScavengerHunt"`) — canonical config

```ts
{
  theme?: string;                        // e.g. "robot", "space", "custom"
  challenge?: {
    answer?: string;                     // lower-cased on write
    text: string;                        // the question shown to the visitor
    title?: string;
    imgUrl: string;
    selectedEmote?: string;              // Expression id granted on correct answer
    questionType?: "text" | "multiple_choice" | "all_that_apply";
    options?: { [key: string]: string }; // { "1": "…", "2": "…", … } for MC / all-that-apply
    correctAnswers?: string[];           // subset of option keys
    lastUpdated?: string;                // ISO
  };
  buildableAssetUniqueName?: string;
  clues?: { [droppedAssetId: string]: ClueType };
  leaderboard?: {
    [profileId: string]: `${displayName}|${cluesCount}|${challengeDone}|${answerAttempts}`;
  };
}
```

#### Clue Dropped Asset

```ts
{
  id: string;
  imgUrl: string;                                       // web-image layer preview
  contentUrl: string;                                   // image / video-iframe / website URL
  mediaType: "image" | "video" | "website";
  linkBehavior: "modal" | "drawer" | "tab";
  text: string;
  // Legacy fields still read for back-compat:
  contentImgUrl?: string; isVideo?: boolean;
}
```

Both `keyAsset.dataObject.clues[assetId]` and `droppedAsset.dataObject` are kept in sync by `handleUpdateClue`.

#### Visitor — per-scene progress

Namespaced by scene so a single visitor can play multiple hunts:

```ts
visitor.dataObject[`${urlSlug}_${sceneDropId}`] = {
  challengeDone: boolean;
  cluesFound: string[];    // dropped-asset ids visited
  answerAttempts: number;
};
```

`getVisitorProgress` walks all such keys to derive `totalCluesCollected`, `uniqueWorlds`, and `totalCompletions` for badge checks.

## API Endpoints

All routes mount under `/api`. Credentials (`assetId`, `visitorId`, `interactiveNonce`, `interactivePublicKey`, `profileId`, `sceneDropId`, `uniqueName`, `urlSlug`, `displayName`) are extracted from `req.query` via `getCredentials`.

| Method   | Route                    | Description                                                                                                                                                                                                                                   |
| -------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/`                      | Sanity check.                                                                                                                                                                                                                                 |
| `GET`    | `/system/health`         | Version, server start, env-var status, hard-coded `SHOWCASE_WORLDS_URLS`.                                                                                                                                                                     |
| `GET`    | `/config`                | Admin config — returns `{ clues, challenge, emotes, theme }`. `emotes` sourced from `visitor.getExpressions({ getUnlockablesOnly: true })`.                                                                                                   |
| `GET`    | `/challenge`             | Visitor / admin state — challenge text, per-visitor progress, badge catalog, visitor's badge inventory, and (admins only) the parsed leaderboard.                                                                                             |
| `POST`   | `/update-challenge`      | Save challenge fields on the key asset (text, imgUrl, title, questionType, options, correctAnswers, selectedEmote, buildableAssetUniqueName, lastUpdated).                                                                                    |
| `POST`   | `/answer-challenge`      | Body `{ answer, selectedAnswers }`. Validates against `questionType`, increments `answerAttempts`, grants emote, fires toast + `explosion_float`, updates leaderboard, awards Quick Thinker / Curious Mind, logs to Google Sheets.            |
| `POST`   | `/restart-challenge`     | Resets the visitor's `{urlSlug}_{sceneDropId}` progress and removes their row from the key asset's leaderboard.                                                                                                                               |
| `GET`    | `/clue`                  | Called by clue-asset click. Records clue in `cluesFound`, fires `disco_float` on new discovery and `partyPopper_float` when the final clue is found, awards Spark of Discovery / Traveler / Scout, updates leaderboard, returns clue payload. |
| `POST`   | `/update-clue`           | Body `{ assetId, imgUrl, contentUrl, mediaType, linkBehavior, text }`. Updates `droppedAsset.dataObject`, `updateWebImageLayers`, and `keyAsset.dataObject.clues[assetId]`; rewires the clickable link (drawer / modal / tab).                |
| `POST`   | `/add-new-clue`          | Drops a fresh `ScavengerHunt_{theme}_clue` at the visitor's position + `{x: +100, y}`. Uses `IMG_ASSET_ID` (falls back to `"webImageAsset"`) and adds it to `keyAsset.dataObject.clues`.                                                      |
| `POST`   | `/remove-clue`           | Body `{ clue: { id } }`. Deletes the dropped asset and removes it from `keyAsset.dataObject.clues`.                                                                                                                                           |
| `POST`   | `/reset-clues`           | Rescans the scene by `fetchDroppedAssetsBySceneDropId({ uniqueName: "ScavengerHunt_{theme}_clue" })` and rewrites `keyAsset.dataObject.clues` from source.                                                                                    |
| `POST`   | `/walk-up-to-clue-asset` | Body `{ clue: { id } }`. Admin-only helper — `visitor.moveVisitor` to the clue's coordinates (no teleport).                                                                                                                                   |
| `POST`   | `/uploads`               | Base64 image upload. Body `{ filename, contentType, data }`. Validates MIME (png/jpeg/webp/gif) + 2 MB cap; stores at `userUploads/{interactivePublicKey}/{profileId}_{sanitizedFilename}`.                                                   |
| `GET`    | `/uploads`               | Lists this admin's uploads only (filtered server-side by `profileId` prefix inside the app's `interactivePublicKey` folder).                                                                                                                  |
| `DELETE` | `/uploads`               | Body `{ key }`. Refuses (403) if the S3 key doesn't start with the caller's `profileId_`.                                                                                                                                                     |

## Analytics

All analytics are sent as `{ analytics: [...] }` options on data-object writes (`visitor.updateDataObject`, `keyAsset.updateDataObject`). Analytics are emitted twice — once globally and once suffixed with the current `theme` — so per-theme funnels can be built alongside the global aggregate.

| Event                                     | Fired when                                                                                   | Where                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| `starts` / `{theme}-starts`               | First `/clue` call for a visitor in this scene (no prior `userChallenge` record).            | `handleGetClue`          |
| `cluesFound{N}` / `{theme}-cluesFound{N}` | Visitor discovers their Nth clue (N = 1..totalClues). Also fires N=1 on the first-clue path. | `handleGetClue`          |
| `completions` / `{theme}-completions`     | Correct final answer.                                                                        | `handleAnswerChallenge`  |
| `{theme}-1-emoteUnlocked`                 | `visitor.grantExpression` returned `success: true` — a new emote was actually granted.       | `handleAnswerChallenge`  |
| `restarts`                                | Visitor hits Restart Scavenger Hunt (`POST /restart-challenge`).                             | `handleRestartChallenge` |
| `resets` / `{theme}-resets`               | Admin resets the clue catalog (`POST /reset-clues`).                                         | `handleResetClues`       |
| `challengeUpdates`                        | Admin saves the challenge (`POST /update-challenge`).                                        | `handleUpdateChallenge`  |
| `clueUpdates`                             | Admin edits a clue (`POST /update-clue`).                                                    | `handleUpdateClue`       |

In addition, `handleAnswerChallenge` appends a row to Google Sheets on completion via `addNewRowToGoogleSheets` (event = `{theme}-completions`) when `GOOGLESHEETS_SHEET_ID` is set.

## Environment Variables

Create a `.env` at the app root. See [`.env-example`](./.env-example) for a template.

| Variable                    | Description                                                                                                                               | Required                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `INTERACTIVE_KEY`           | Topia interactive app key.                                                                                                                | Yes                         |
| `INTERACTIVE_SECRET`        | Topia interactive app secret.                                                                                                             | Yes                         |
| `INSTANCE_DOMAIN`           | Topia API domain (`api.topia.io` for prod, `api-stage.topia.io` for staging). Defaults to `api.topia.io`.                                 | Yes                         |
| `INSTANCE_PROTOCOL`         | `https` for prod/staging, `http` for local. Defaults to `https`.                                                                          | No                          |
| `API_KEY`                   | Passed to `Topia` when running with a full API key (in addition to interactive creds).                                                    | No                          |
| `IMG_ASSET_ID`              | Base asset id used by `/add-new-clue` when dropping new clue assets. Defaults to `"webImageAsset"`.                                       | No                          |
| `S3_BUCKET`                 | Bucket that receives `/uploads`. Throws on upload if missing.                                                                             | Yes for image uploads       |
| `GOOGLESHEETS_SHEET_ID`     | Spreadsheet id for completion logging. When unset, `addNewRowToGoogleSheets` silently no-ops.                                             | No                          |
| `GOOGLESHEETS_CLIENT_EMAIL` | Service-account email for Google Sheets JWT.                                                                                              | No (required with sheet id) |
| `GOOGLESHEETS_PRIVATE_KEY`  | Service-account private key for Google Sheets JWT (newlines escaped as `\n`).                                                             | No (required with sheet id) |
| `NODE_ENV`                  | `development` enables permissive CORS for `localhost:3000` / `:5173`, unsigned (anonymous) S3 requests, and skips serving `client/build`. | No                          |
| `PORT`                      | Server port. Defaults to `3000`.                                                                                                          | No                          |
| `COMMIT_HASH`               | Surfaced by `/system/health` for deploy verification.                                                                                     | No                          |
| `SKIP_PREFLIGHT_CHECK`      | Legacy CRA flag; surfaced by `/system/health` only.                                                                                       | No                          |

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

```bash
# from the app root
npm install                       # installs root + workspaces (client, server)

# create a .env at the app root
cp .env-example .env              # then fill in INTERACTIVE_KEY / INTERACTIVE_SECRET

# run client + server together
npm run dev
```

Other scripts (from `package.json`):

- `npm run build` — builds both workspaces
- `npm run server` / `npm run client` — production-style single-workspace start
- `npm run dev-server` / `npm run dev-client` — dev mode, single workspace

### Docker

```bash
# local development
docker-compose up

# production build
docker build . -t sdk-scavenger-hunt:v[version]
```

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Key-asset-canonical, world-legacy.** `world.dataObject` now stores only `{ [sceneDropId]: { keyAssetId } }`. All challenge / theme / clues / buildableAssetUniqueName data lives on the key asset (`resolveKeyAsset` looks for `uniqueName === "ScavengerHunt"`). `getConfig` transparently migrates any legacy `world.dataObject.scenes.{sceneDropId}` payload onto the key asset and then collapses the world entry — idempotent, safe to call repeatedly.
- **Per-scene visitor keys.** Progress is namespaced `{urlSlug}_{sceneDropId}` (older `{urlSlug}-{sceneDropId}` with a dash is migrated to the underscore form on read in `getUserChallenge`).
- **Clue asset uniqueName is theme-derived.** Discovery uses `world.fetchDroppedAssetsBySceneDropId({ uniqueName: "ScavengerHunt_{theme}_clue" })`. Changing `theme` on the key asset will orphan any previously placed clues that used the old theme name.
- **`buildableAssetUniqueName` is admin free-text**, not a fixed name — the input is only surfaced in the Admin UI when `theme === "national-park"` (see `client/src/components/Admin.tsx`). It's persisted on the key asset regardless of theme.
- **Emote grant is conditional analytics.** The `{theme}-1-emoteUnlocked` event is only pushed when `visitor.grantExpression` returns `success: true`, so re-answering doesn't double-count.
- **Ecosystem inventory is cached in-process for 6h** in `server/utils/inventoryCache.ts`. On fetch failure it returns a stale cached copy rather than throwing. Clients can force a refresh via `GET /challenge?forceRefreshInventory=true`.
- **Anonymous S3 in dev.** When `NODE_ENV=development`, `getS3Client` signs requests with a no-op signer so uploads only succeed against `Principal: "*"` bucket policies — matches a deploy that has no AWS credentials configured on the server. Prod signs normally.
- **Uploads namespaced twice.** S3 keys are `userUploads/{interactivePublicKey}/{profileId}_{filename}`. Listing / deleting cross-checks both the app segment and the profileId segment — an admin never sees or can delete another admin's uploads, even from another app sharing the same bucket.
- **Leaderboard is pipe-delimited.** `keyAsset.dataObject.leaderboard[profileId] = "displayName|cluesCount|challengeDone|answerAttempts"`. Parsed in `handleGetChallenge` when `visitor.isAdmin` is true.
- **`isAdmin: true` in `/clue` response is a placeholder** — the current controller hard-codes it. Real admin gating lives in `handleGetChallenge` via `visitor.isAdmin`.
- **No polling, no SSE.** Client refreshes via explicit endpoint calls. All real-time feedback goes through Topia (`fireToast`, `triggerParticle`, `world.triggerParticle`).
- **`cleanReturnPayload` middleware** strips SDK internals from every JSON response — see `server/utils/cleanReturnPayload.ts`.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/scavenger-hunt-dev), [Prod](https://topia.io/scavenger-hunt-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/Scavenger-Hunt-07d01f7d7c984d968b62db1983ff137a?v=71f6c3828d3b4f33960326f9bde24781)
