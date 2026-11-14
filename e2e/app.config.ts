// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.

/**
 * Bugs a route still has, each set to its tracking reason (e.g. "EXP-429: ..."). The matching
 * platform test is marked test.fail: it passes while the bug exists and fails once it's fixed, so
 * the entry is removed together with the fix. Leave out what the route doesn't have.
 */
export type KnownBugs = {
  /** The response contains the interactive secret or a signed InteractiveJWT. */
  leaksSecret?: string;
  /** A request without session credentials succeeds. */
  acceptsMissingCredentials?: string;
  /** Credentials signed for another app's public key are accepted. */
  acceptsForeignCredentials?: string;
  /** Bad credentials fail later on a Topia call instead of with a credential error. */
  unnamedCredentialError?: string;
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under /api, without the query string. */
  path: string;
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

// getCredentials throws, but errorHandler sends the Error object (serialized as {}) with a generic
// message, so the reason is lost. Every route goes through it.
const CREDENTIAL_ERROR_LOST = "EXP-439 #8: errorHandler drops the credential error's message";
const bugs = { knownBugs: { unnamedCredentialError: CREDENTIAL_ERROR_LOST } };

/**
 * API routes that read the session credentials (getCredentials). Each one must reject missing or
 * foreign credentials and must never send the interactive secret to the browser. List them all.
 */
export const CREDENTIALED_ROUTES: RouteSpec[] = [
  { method: "get", path: "/config", ...bugs },
  { method: "get", path: "/challenge", ...bugs },
  { method: "post", path: "/update-challenge", data: { answer: "x", text: "Q", imgUrl: "" }, ...bugs },
  { method: "post", path: "/answer-challenge", data: { answer: "x" }, ...bugs },
  { method: "post", path: "/restart-challenge", ...bugs },
  { method: "get", path: "/clue", ...bugs },
  { method: "post", path: "/update-clue", data: { assetId: "clue-1", text: "T", imgUrl: "", contentUrl: "", mediaType: "image", linkBehavior: "drawer" }, ...bugs },
  { method: "post", path: "/remove-clue", data: { clue: { id: "clue-1" } }, ...bugs },
  { method: "post", path: "/reset-clues", ...bugs },
  { method: "post", path: "/walk-up-to-clue-asset", data: { clue: { id: "clue-1" } }, ...bugs },
  { method: "post", path: "/add-new-clue", ...bugs },
  { method: "post", path: "/uploads", data: { filename: "a.png", contentType: "image/png", data: "iVBORw0KGgo=" }, ...bugs },
  { method: "get", path: "/uploads", ...bugs },
  { method: "delete", path: "/uploads", data: { key: "userUploads/e2e-public-key/someone_a.png" }, ...bugs },
];

/** Page the app opens in its iframe; the platform tests load it with valid credentials. */
export const ENTRY_PAGE = "/";

/** Bugs seen when loading ENTRY_PAGE (only leaksSecret applies). */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> = {};

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';
