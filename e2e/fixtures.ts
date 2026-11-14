import { APIRequestContext, test as base, expect } from "@playwright/test";
import { INTERACTIVE_KEY, MOCK_TOPIA_URL } from "./constants";

export const KEY_ASSET_ID = "key-asset";
export const SCENE_DROP_ID = "scene-1";
export const VISITOR_ID = 42;

// ---- Scavenger Hunt data ----
export const KEY_UNIQUE_NAME = "ScavengerHunt";
export const THEME = "robot";
export const CLUE_UNIQUE_NAME = `${KEY_UNIQUE_NAME}_${THEME}_clue`;
/** Where the visitor stands (Visitor.get moveTo); "Add New Item" drops 100px to the right. */
export const VISITOR_POSITION = { x: 300, y: 400 };

export type Clue = {
  id: string;
  imgUrl: string;
  text: string;
  contentUrl: string;
  mediaType: "image" | "video" | "website";
  linkBehavior: "modal" | "drawer" | "tab";
};

export const clue = (id: string, fields: Partial<Clue> = {}): Clue => ({
  id,
  imgUrl: `https://example.invalid/${id}.png`,
  text: `Find me: ${id}`,
  contentUrl: `https://example.invalid/${id}-content.png`,
  mediaType: "image",
  linkBehavior: "drawer",
  ...fields,
});

/** Clue dropped assets in the key asset's scene (uniqueName ScavengerHunt_robot_clue), each holding its clue data. */
export const clueAssets = (clues: Clue[], fields: Record<string, unknown> = {}) =>
  Object.fromEntries(
    clues.map((c, i) => [
      c.id,
      {
        id: c.id,
        assetName: "Clue",
        uniqueName: CLUE_UNIQUE_NAME,
        sceneDropId: SCENE_DROP_ID,
        position: { x: 1000 + 100 * i, y: 200 },
        topLayerURL: c.imgUrl,
        ...fields,
        dataObject: { ...c },
      },
    ]),
  );

export type Challenge = {
  answer?: string;
  text: string;
  title?: string;
  imgUrl: string;
  selectedEmote?: string;
  questionType?: "text" | "multiple_choice" | "all_that_apply";
  options?: Record<string, string>;
  correctAnswers?: string[];
};

export const TEXT_CHALLENGE: Challenge = {
  answer: "gears",
  text: "What makes a robot tick?",
  title: "Robot Hunt",
  imgUrl: "https://example.invalid/challenge.png",
};

export const MC_CHALLENGE: Challenge = {
  text: "Which planet is red?",
  title: "Space Hunt",
  imgUrl: "https://example.invalid/challenge.png",
  questionType: "multiple_choice",
  options: { "1": "Venus", "2": "Mars", "3": "Jupiter", "4": "Saturn" },
  correctAnswers: ["2"],
};

export const ALL_THAT_APPLY_CHALLENGE: Challenge = {
  text: "Which of these are robots?",
  imgUrl: "https://example.invalid/challenge.png",
  questionType: "all_that_apply",
  options: { "1": "R2-D2", "2": "A toaster", "3": "WALL-E", "4": "A cat" },
  correctAnswers: ["1", "3"],
};

/** A configured key-asset data object. */
export const hunt = ({
  clues = [],
  challenge = TEXT_CHALLENGE,
  leaderboard,
  theme = THEME,
}: { clues?: Clue[]; challenge?: Challenge | null; leaderboard?: Record<string, string>; theme?: string } = {}) => ({
  theme,
  ...(challenge && { challenge }),
  clues: Object.fromEntries(clues.map((c) => [c.id, c])),
  ...(leaderboard && { leaderboard }),
});

/** The visitor's progress entry, keyed `${urlSlug}_${sceneDropId}`. */
export type Progress = { challengeDone: boolean; cluesFound: string[]; answerAttempts?: number };

/** A 1x1 PNG, as the image picker posts it. */
export const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export type SeedOptions = {
  isAdmin?: boolean;
  /** Visitor is standing inside the asset's zone. */
  inZone?: boolean;
  /** false = the dropped asset the app was opened from doesn't exist in the world. */
  withAsset?: boolean;
  /** Extra dropped-asset fields (assetName, topLayerURL, uniqueName, ...). */
  asset?: Record<string, unknown>;
  /** The dropped asset's data object. */
  assetData?: Record<string, unknown>;
  /** The world's data object. */
  worldData?: Record<string, unknown>;
  /** The visitor's data object. */
  visitorData?: Record<string, unknown>;
  /** Badges the visitor already owns. */
  badges?: string[];
  /** Further dropped assets in the world, keyed by id. */
  extraAssets?: Record<string, Record<string, unknown>>;
};

/** One isolated Topia world in mock-topia, plus helpers to open the app inside it. */
export class TopiaWorld {
  readonly displayName = "E2E Player";

  constructor(
    readonly urlSlug: string,
    readonly profileId: string,
    private request: APIRequestContext,
  ) {}

  async seed({
    isAdmin = false,
    inZone = true,
    withAsset = true,
    asset = {},
    assetData = {},
    worldData = {},
    visitorData = {},
    badges = [],
    extraAssets = {},
  }: SeedOptions = {}) {
    const assets: Record<string, any> = { ...extraAssets };
    if (withAsset) {
      assets[KEY_ASSET_ID] = {
        id: KEY_ASSET_ID,
        assetName: "E2E Asset",
        position: { x: 500, y: 500 },
        uniqueName: KEY_UNIQUE_NAME,
        sceneDropId: SCENE_DROP_ID,
        topLayerURL: "https://example.invalid/e2e-asset.png",
        ...asset,
        dataObject: assetData,
      };
    }

    const response = await this.request.post(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, {
      data: {
        dataObject: worldData,
        assets,
        visitors: {
          [VISITOR_ID]: {
            isAdmin,
            profileId: this.profileId,
            displayName: this.displayName,
            moveTo: VISITOR_POSITION,
            landmarkZonesString: inZone ? Object.keys(assets).join(",") : "",
            privateZoneId: "",
            dataObject: visitorData,
            inventory: badges.map((name) => ({
              id: `owned-${name}`,
              item_id: `owned-${name}`,
              status: "ACTIVE",
              item: { name, type: "BADGE", image_url: "" },
            })),
          },
        },
      },
    });
    if (!response.ok()) throw new Error(`Seeding mock world failed: ${response.status()}`);
  }

  async state() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`);
    return (await response.json()) as {
      dataObject: Record<string, any>;
      assets: Record<string, any>;
      visitors: Record<string, any>;
      events: Array<Record<string, any>>;
      unhandled: string[];
    };
  }

  async assetData(assetId = KEY_ASSET_ID) {
    return (await this.state()).assets[assetId]?.dataObject;
  }

  async visitorData() {
    return (await this.state()).visitors[VISITOR_ID].dataObject;
  }

  /** This world's progress entry in the visitor's data object. */
  async progress(): Promise<Progress | undefined> {
    return (await this.visitorData())?.[`${this.urlSlug}_${SCENE_DROP_ID}`];
  }

  /** Progress entry as stored in the visitor data object, for seeding. */
  progressEntry(progress: Progress) {
    return { [`${this.urlSlug}_${SCENE_DROP_ID}`]: progress };
  }

  /** The fake S3 bucket (shared across tests: filtered to this world's profileId). */
  async s3() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/s3`);
    const { objects, log } = (await response.json()) as {
      objects: Record<string, { bytes: number; contentType: string }>;
      log: Array<{ action: string; key: string }>;
    };
    const mine = (key: string) => key.includes(`/${this.profileId}_`);
    return {
      objects: Object.fromEntries(Object.entries(objects).filter(([key]) => mine(key))),
      log: log.filter((entry) => entry.action !== "list" && mine(entry.key)),
    };
  }

  /** Puts objects straight into the fake S3 bucket. */
  async seedS3(objects: Record<string, { bytes: number; lastModified?: string }>) {
    const data = Object.fromEntries(
      Object.entries(objects).map(([key, o]) => [key, { lastModified: new Date().toISOString(), ...o }]),
    );
    await this.request.post(`${MOCK_TOPIA_URL}/__mock/s3`, { data });
  }

  async events(type?: string) {
    const { events } = await this.state();
    return type ? events.filter((e) => e.type === type) : events;
  }

  /** Session credentials Topia appends to the app's iframe URL. */
  credentials(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      assetId: KEY_ASSET_ID,
      displayName: this.displayName,
      identityId: "identity-1",
      interactiveNonce: "e2e-nonce",
      interactivePublicKey: INTERACTIVE_KEY,
      profileId: this.profileId,
      sceneDropId: SCENE_DROP_ID,
      uniqueName: KEY_UNIQUE_NAME,
      urlSlug: this.urlSlug,
      username: "e2e-player",
      visitorId: String(VISITOR_ID),
      ...overrides,
    });
  }

  /** App page URL as Topia opens it in the iframe. */
  url(path = "/", overrides: Record<string, string> = {}) {
    return `${path}?${this.credentials(overrides)}`;
  }

  /** App API path carrying the session credentials, as the client's backendAPI sends them. */
  api(path: string, overrides: Record<string, string> = {}) {
    return `/api${path}?${this.credentials(overrides)}`;
  }
}

export const test = base.extend<{ world: TopiaWorld }>({
  // Keep the browser hermetic: only the app itself is reachable (theme images, icons and clue media
  // point at real S3 buckets and websites).
  page: async ({ page }, use) => {
    await page.route(
      (url) => url.hostname !== "localhost",
      (route) => route.abort(),
    );
    await use(page);
  },
  world: async ({ request }, use, testInfo) => {
    const id = `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`.replace(/[^a-zA-Z0-9-]/g, "");
    const world = new TopiaWorld(`world-${id}`, `profile-${id}`, request);
    await use(world);

    // Fail the test if the app called a public-API endpoint the mock doesn't implement (e.g. after an
    // @rtsdk/topia upgrade): it would otherwise pass against a 501 the real API never returns.
    expect((await world.state()).unhandled, "public-API calls mock-topia doesn't implement").toEqual([]);
    const outside = await (await request.get(`${MOCK_TOPIA_URL}/__mock/unhandled`)).json();
    expect(outside, "public-API calls mock-topia doesn't implement").toEqual([]);
  },
});

export { expect } from "@playwright/test";
