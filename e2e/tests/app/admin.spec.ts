import { Page } from "@playwright/test";
import {
  CLUE_UNIQUE_NAME,
  KEY_ASSET_ID,
  MC_CHALLENGE,
  PNG_DATA_URL,
  SCENE_DROP_ID,
  TEXT_CHALLENGE,
  VISITOR_POSITION,
  clue,
  clueAssets,
  expect,
  hunt,
  test,
} from "../../fixtures";
import { INTERACTIVE_KEY } from "../../constants";

const CLUES = [clue("clue-1"), clue("clue-2"), clue("clue-3")];

/** Input or select directly under a <label> with this exact text (the form's labels aren't linked). */
const field = (page: Page, label: string) =>
  page.locator(`div:has(> label:text-is("${label}"))`).locator("> input, > select").first();

const openSettings = async (page: Page) => {
  await page.locator("button.icon-with-rounded-border").click();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
};

test("only admins see the settings button", async ({ page, world }) => {
  await world.seed({ isAdmin: false, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
  await page.goto(world.url("/"));
  await expect(page.getByRole("heading", { name: "Completed 0 of 3" })).toBeVisible();
  await expect(page.locator("button.icon-with-rounded-border")).toHaveCount(0);

  await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
  await page.reload();
  await expect(page.locator("button.icon-with-rounded-border")).toBeVisible();
});

test.describe("challenge settings", () => {
  test("the form shows the saved challenge and the unlockable emotes", async ({ page, world }) => {
    await world.seed({
      isAdmin: true,
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES, challenge: { ...TEXT_CHALLENGE, selectedEmote: "expr-wave" } }),
    });
    await page.goto(world.url("/"));
    await openSettings(page);

    await expect(page.getByPlaceholder("My Scavenger Hunt")).toHaveValue("Robot Hunt");
    await expect(field(page, "Question")).toHaveValue(TEXT_CHALLENGE.text);
    await expect(field(page, "Answer")).toHaveValue("gears");
    await expect(field(page, "Emote")).toHaveValue("expr-wave");
    await expect(field(page, "Emote").locator("option")).toHaveText(["Select an emote", "scavengerHunt-robot-1", "Golden Wave"]);
    await expect(page.locator(".card.small h4")).toHaveText(CLUES.map((c) => c.text));
  });

  test("saving a text challenge stores it on the key asset with the answer lower-cased", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES, challenge: null }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.getByPlaceholder("My Scavenger Hunt").fill("Bolt Hunt");
    await field(page, "Question").fill("What holds a robot together?");
    await field(page, "Answer").fill("Bolts");
    await field(page, "Emote").selectOption("expr-wave");
    await page.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(async () => (await world.assetData(KEY_ASSET_ID)).challenge)
      .toMatchObject({
        title: "Bolt Hunt",
        text: "What holds a robot together?",
        answer: "bolts",
        questionType: "text",
        selectedEmote: "expr-wave",
        lastUpdated: expect.any(String),
      });
  });

  test("a text challenge needs an answer before it's saved", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES, challenge: null }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await field(page, "Question").fill("No answer?");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Please provide an answer.")).toBeVisible();
    expect((await world.assetData(KEY_ASSET_ID)).challenge).toBeUndefined();
  });

  test("saving a multiple-choice challenge stores the options and the correct one", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES, challenge: null }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await field(page, "Question Type").selectOption("multiple_choice");
    await field(page, "Question").fill("Which planet is red?");
    for (const [i, name] of ["Venus", "Mars", "Jupiter", "Saturn"].entries()) {
      await page.getByPlaceholder(`Option ${i + 1}`).fill(name);
    }
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Please select at least one correct answer.")).toBeVisible();

    await page.locator("div.flex.items-center", { has: page.getByPlaceholder("Option 2") }).getByRole("radio").check();
    await page.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(async () => (await world.assetData(KEY_ASSET_ID)).challenge)
      .toMatchObject({
        questionType: "multiple_choice",
        options: MC_CHALLENGE.options,
        correctAnswers: ["2"],
        text: "Which planet is red?",
      });
  });
});

test.describe("results", () => {
  test("the results tab lists participants, completions first", async ({ page, world }) => {
    await world.seed({
      isAdmin: true,
      extraAssets: clueAssets(CLUES),
      assetData: hunt({
        clues: CLUES,
        leaderboard: { p1: "Ana|1|false|0", p2: "Ben|3|true|2", p3: "Cy|2|false|1" },
      }),
    });
    await page.goto(world.url("/"));
    await openSettings(page);
    await page.getByRole("button", { name: "Results" }).click();

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("Ben3 of 32Yes");
    await expect(rows.nth(1)).toContainText("Cy2 of 31No");
    await expect(rows.nth(2)).toContainText("Ana1 of 30No");
    await expect(page.locator(".card.success h2")).toHaveText("1");
  });

  test("with no participants the results tab says so", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));
    await openSettings(page);
    await page.getByRole("button", { name: "Results" }).click();

    await expect(page.getByText("No results yet.")).toBeVisible();
  });
});

test.describe("items", () => {
  test("adding an item drops a clue asset next to the admin and lists it", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.getByRole("button", { name: "Add New Item" }).click();

    await expect(page.getByRole("heading", { name: "Clue 4" })).toBeVisible();
    const state = await world.state();
    const [id, dropped] = Object.entries(state.assets).find(([assetId]) => assetId.startsWith("dropped-"))!;
    expect(dropped).toMatchObject({
      assetId: "e2e-web-image-asset",
      uniqueName: CLUE_UNIQUE_NAME,
      sceneDropId: SCENE_DROP_ID,
      position: { x: VISITOR_POSITION.x + 100, y: VISITOR_POSITION.y },
      clickableLink: expect.stringMatching(/\/clue$/),
      isOpenLinkInDrawer: true,
      isInteractive: true,
      interactivePublicKey: INTERACTIVE_KEY,
    });
    const expected = { id, imgUrl: "", text: "Clue 4", contentUrl: "", mediaType: "image", linkBehavior: "drawer" };
    expect(dropped.dataObject).toEqual(expected);
    expect(state.assets[KEY_ASSET_ID].dataObject.clues[id]).toEqual(expected);
  });

  test("editing an item saves its text, media and link behaviour everywhere it's read", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.locator(".card.small", { hasText: "Find me: clue-2" }).click();
    await expect(page.getByRole("heading", { name: "Item Configuration" })).toBeVisible();
    await page.locator(".modal textarea").fill("Look under the stairs");
    await page.locator(".modal label", { hasText: "Media Type" }).locator("select").selectOption("video");
    await page.locator(".modal input.input").fill("https://example.invalid/embed/new");
    await page.locator(".modal label", { hasText: "Link Behavior" }).locator("select").selectOption("modal");
    await page.locator(".modal .clue-image").nth(1).click();
    await page.locator(".modal").getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("heading", { name: "Item Configuration" })).toHaveCount(0);
    const saved = { id: "clue-2", text: "Look under the stairs", contentUrl: "https://example.invalid/embed/new", mediaType: "video", linkBehavior: "modal" };
    await expect.poll(async () => (await world.assetData("clue-2"))).toMatchObject(saved);
    const keyClue = (await world.assetData(KEY_ASSET_ID)).clues["clue-2"];
    expect(keyClue).toMatchObject(saved);
    const imgUrl = keyClue.imgUrl;
    expect(imgUrl).toMatch(/^https:\/\//);
    expect(await world.events("set-webimage-layers")).toEqual([expect.objectContaining({ assetId: "clue-2", top: imgUrl })]);
    expect(await world.events("change-click-type")).toEqual([
      expect.objectContaining({ assetId: "clue-2", isForceLinkInIframe: true, isOpenLinkInDrawer: false }),
    ]);
  });

  test("removing an item deletes its asset and drops it from the list", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.locator(".card.small", { hasText: "Find me: clue-3" }).getByRole("button").nth(1).click();
    await expect(page.getByRole("heading", { name: "Remove Item" })).toBeVisible();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect(page.locator(".card.small")).toHaveCount(2);
    expect(await world.events("delete-asset")).toEqual([{ type: "delete-asset", assetId: "clue-3" }]);
    expect(Object.keys((await world.assetData(KEY_ASSET_ID)).clues)).toEqual(["clue-1", "clue-2"]);
  });

  test("the walk button moves the admin to the item", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.locator(".card.small").nth(1).getByRole("button").nth(0).click();

    await expect
      .poll(async () => await world.events("move"))
      .toEqual([expect.objectContaining({ moveTo: { x: 1100, y: 200 }, teleport: false })]);
  });

  test("Reset Items rebuilds the list from the clue assets in the scene", async ({ page, world }) => {
    test.fail(true, "EXP-439: reset looks for `undefined_robot_clue` (key asset's uniqueName is never fetched) and wipes the list");
    // The stored list is stale: it lacks clue-3 and still has a clue that was deleted from the scene.
    await world.seed({
      isAdmin: true,
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: [CLUES[0], CLUES[1], clue("deleted-clue")] }),
    });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.getByRole("button", { name: "Reset Items" }).click();

    await expect.poll(async () => Object.keys((await world.assetData(KEY_ASSET_ID)).clues).sort()).toEqual(["clue-1", "clue-2", "clue-3"]);
    await expect(page.locator(".card.small")).toHaveCount(3);
  });
});

test.describe("image uploads", () => {
  const myKey = (profileId: string, name: string) => `userUploads/${INTERACTIVE_KEY}/${profileId}_${name}`;

  test("an admin uploads an image to S3 under their own key and it becomes the challenge image", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));
    await openSettings(page);

    await page.locator("div", { has: page.locator("> label", { hasText: "Challenge Image" }) }).getByRole("button", { name: "Edit" }).click();
    const png = Buffer.from(PNG_DATA_URL.split(",")[1], "base64");
    await page.locator('input[type="file"]').setInputFiles({ name: "my photo!.png", mimeType: "image/png", buffer: png });

    const key = myKey(world.profileId, "my-photo.png");
    await expect.poll(async () => Object.keys((await world.s3()).objects)).toEqual([key]);
    expect((await world.s3()).objects[key]).toMatchObject({ contentType: "image/png", bytes: png.length });
    await expect(page.getByRole("img", { name: "Challenge Image preview" })).toHaveAttribute(
      "src",
      `https://e2e_bucket.s3.amazonaws.com/${key}`,
    );
  });

  test("an admin only sees and deletes their own uploads", async ({ request, world }) => {
    await world.seed({ isAdmin: true, assetData: hunt({ clues: CLUES }) });
    const mine = myKey(world.profileId, "mine.png");
    const theirs = myKey(`${world.profileId}x`, "theirs.png");
    await world.seedS3({ [mine]: { bytes: 10 }, [theirs]: { bytes: 20 } });

    const list = await (await request.get(world.api("/uploads"))).json();
    expect(list.items.map((i: { key: string }) => i.key)).toEqual([mine]);

    const forbidden = await request.delete(world.api("/uploads"), { data: { key: theirs } });
    expect(forbidden.status()).toBe(403);
    const ok = await request.delete(world.api("/uploads"), { data: { key: mine } });
    expect(ok.ok()).toBe(true);
    expect((await world.s3()).log).toEqual([{ action: "delete", bucket: "e2e_bucket", key: mine }]);
  });

  test("uploads that aren't small images are rejected before reaching S3", async ({ request, world }) => {
    await world.seed({ isAdmin: true, assetData: hunt({ clues: CLUES }) });

    const html = await request.post(world.api("/uploads"), {
      data: { filename: "x.html", contentType: "text/html", data: Buffer.from("<script>").toString("base64") },
    });
    expect(html.status()).toBe(400);
    const big = await request.post(world.api("/uploads"), {
      data: { filename: "big.png", contentType: "image/png", data: Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64") },
    });
    expect(big.status()).toBe(413);
    expect((await world.s3()).log).toEqual([]);
  });
});

test("a hunt configured the old way (on the world) is moved onto the key asset on first open", async ({ page, world }) => {
  await world.seed({
    isAdmin: true,
    extraAssets: clueAssets(CLUES),
    worldData: {
      scenes: {
        [SCENE_DROP_ID]: {
          keyAssetId: KEY_ASSET_ID,
          theme: "robot",
          challenge: TEXT_CHALLENGE,
          clues: Object.fromEntries(CLUES.map((c) => [c.id, c])),
        },
      },
    },
  });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Completed 0 of 3" })).toBeVisible();
  const state = await world.state();
  expect(state.assets[KEY_ASSET_ID].dataObject).toMatchObject({
    theme: "robot",
    challenge: TEXT_CHALLENGE,
    clues: Object.fromEntries(CLUES.map((c) => [c.id, c])),
  });
  expect(state.dataObject).toEqual({ [SCENE_DROP_ID]: { keyAssetId: KEY_ASSET_ID }, scenes: { [SCENE_DROP_ID]: null } });
});
