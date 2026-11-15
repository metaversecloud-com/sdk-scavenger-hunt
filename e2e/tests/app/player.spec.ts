import {
  ALL_THAT_APPLY_CHALLENGE,
  CLUE_UNIQUE_NAME,
  KEY_ASSET_ID,
  MC_CHALLENGE,
  TEXT_CHALLENGE,
  clue,
  clueAssets,
  expect,
  hunt,
  test,
} from "../../fixtures";

const CLUES = [clue("clue-1"), clue("clue-2"), clue("clue-3")];
const ALL_FOUND = ["clue-1", "clue-2", "clue-3"];

/** The /clue page as Topia opens it when a visitor clicks a clue asset. */
const clueUrl = (world: { url: (path: string, o?: Record<string, string>) => string }, assetId: string) =>
  world.url("/clue", { assetId, uniqueName: CLUE_UNIQUE_NAME });

test.describe("challenge page", () => {
  test("a new player sees the hunt and how many items are left", async ({ page, world }) => {
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(world.url("/"));

    await expect(page.getByRole("heading", { name: "Robot Hunt" })).toBeVisible();
    await expect(page.getByText("Explore the world to find all of the items!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Completed 0 of 3" })).toBeVisible();
    // The question stays hidden until every item is found.
    await expect(page.getByText(TEXT_CHALLENGE.text)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Restart Scavenger Hunt" })).toHaveCount(0);
    expect(await world.progress()).toEqual({ challengeDone: false, cluesFound: [] });
  });

  test("a hunt without items says it isn't configured yet", async ({ page, world }) => {
    await world.seed({ assetData: hunt() });
    await page.goto(world.url("/"));

    await expect(page.getByText("This challenge hasn't been configured yet. Please check back later!")).toBeVisible();
  });

  test("returning players see their progress, and older progress keys are migrated", async ({ page, world }) => {
    test.fail(true, "EXP-439: the migration deletes the old key locally but updateDataObject never removes it");
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES }),
      visitorData: { [`${world.urlSlug}-scene-1`]: { challengeDone: false, cluesFound: ["clue-1", "clue-2"] } },
    });
    await page.goto(world.url("/"));

    await expect(page.getByRole("heading", { name: "Completed 2 of 3" })).toBeVisible();
    const data = await world.visitorData();
    expect(data[`${world.urlSlug}_scene-1`]).toEqual({ challengeDone: false, cluesFound: ["clue-1", "clue-2"] });
    expect(data).not.toHaveProperty(`${world.urlSlug}-scene-1`);
  });

  test("the badges tab shows the ecosystem's active badges and greys out the ones not owned", async ({ page, world }) => {
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }), badges: ["Scout"] });
    await page.goto(world.url("/"));
    await page.getByRole("button", { name: "Badges" }).click();

    for (const name of ["Spark of Discovery", "Traveler", "Scout", "Quick Thinker", "Curious Mind"]) {
      await expect(page.getByRole("img", { name })).toBeVisible();
    }
    await expect(page.getByRole("img", { name: "Retired Badge" })).toHaveCount(0);
    await expect(page.getByRole("img", { name: "Scout" })).toHaveCSS("filter", "none");
    await expect(page.getByRole("img", { name: "Traveler" })).toHaveCSS("filter", "grayscale(1)");
  });
});

test.describe("finding items", () => {
  test("opening an item records it, celebrates it and awards the first-find badge", async ({ page, world }) => {
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(clueUrl(world, "clue-2"));

    await expect(page.getByRole("heading", { name: "Congratulations!" })).toBeVisible();
    await expect(page.getByText("Progress: 1 of 3 completed.")).toBeVisible();
    await expect(page.getByText("Find me: clue-2")).toBeVisible();
    await expect(page.getByRole("img", { name: "Content Image" })).toHaveAttribute("src", CLUES[1].contentUrl);
    await expect(page.getByText("Final challenge unlocked")).toHaveCount(0);

    expect((await world.progress())?.cluesFound).toEqual(["clue-2"]);
    expect(await world.events("particles")).toEqual([
      expect.objectContaining({ particleName: "disco_float", position: { x: 1100, y: 200 } }),
    ]);
    expect(await world.events("grant-item")).toEqual([expect.objectContaining({ name: "Spark of Discovery" })]);
    expect(await world.events("fire-toast")).toContainEqual(expect.objectContaining({ title: "Badge Earned!" }));
    expect((await world.assetData(KEY_ASSET_ID)).leaderboard).toEqual({ [world.profileId]: "E2E Player|1|false|0" });
  });

  test("opening the same item again doesn't count it twice", async ({ page, world }) => {
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES }),
      visitorData: world.progressEntry({ challengeDone: false, cluesFound: ["clue-1"] }),
      badges: ["Spark of Discovery"],
    });
    await page.goto(clueUrl(world, "clue-1"));

    await expect(page.getByText("Progress: 1 of 3 completed.")).toBeVisible();
    expect((await world.progress())?.cluesFound).toEqual(["clue-1"]);
    expect(await world.events("particles")).toEqual([]);
    expect(await world.events("grant-item")).toEqual([]);
  });

  test("finding the last item unlocks the final challenge", async ({ page, world }) => {
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES }),
      visitorData: world.progressEntry({ challengeDone: false, cluesFound: ["clue-1", "clue-2"] }),
      badges: ["Spark of Discovery"],
    });
    await page.goto(clueUrl(world, "clue-3"));

    await expect(page.getByText("Progress: 3 of 3 completed.")).toBeVisible();
    await expect(page.getByText("Final challenge unlocked. Head back to the checkpoint to proceed.")).toBeVisible();
    await expect
      .poll(async () => (await world.events("particles")).map((e) => e.particleName).sort())
      .toEqual(["disco_float", "partyPopper_float"]);
    expect((await world.events("particles")).find((e) => e.particleName === "partyPopper_float")).toMatchObject({
      followPlayerId: 42,
    });

    await page.goto(world.url("/"));
    await expect(page.getByText(TEXT_CHALLENGE.text)).toBeVisible();
    await expect(page.getByText("Answer the final question and unlock a new emote!")).toBeVisible();
  });

  test("collecting items in three worlds earns the Traveler badge", async ({ page, world }) => {
    // getVisitorProgress skips urlSlugs of 26+ characters (the test worlds' slugs are longer), so the
    // three worlds come from seeded progress; finding a new item here triggers the check.
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES }),
      badges: ["Spark of Discovery"],
      visitorData: {
        "other-world-a_scene-9": { challengeDone: false, cluesFound: ["x"] },
        "other-world-b_scene-9": { challengeDone: false, cluesFound: ["y"] },
        "other-world-c_scene-9": { challengeDone: false, cluesFound: ["z"] },
      },
    });
    await page.goto(clueUrl(world, "clue-1"));
    await expect(page.getByText("Progress: 1 of 3 completed.")).toBeVisible();

    expect(await world.events("grant-item")).toEqual([expect.objectContaining({ name: "Traveler" })]);
  });

  test("video and website items are embedded in the drawer", async ({ page, world }) => {
    const media = [
      clue("clue-1", { mediaType: "video", contentUrl: "https://example.invalid/embed/video" }),
      clue("clue-2", { mediaType: "website", contentUrl: "https://example.invalid/site" }),
    ];
    await world.seed({ extraAssets: clueAssets(media), assetData: hunt({ clues: media }) });

    await page.goto(clueUrl(world, "clue-1"));
    await expect(page.locator('iframe[title="Item Video"]')).toHaveAttribute("src", "https://example.invalid/embed/video");

    await page.goto(clueUrl(world, "clue-2"));
    await expect(page.locator('iframe[title="Item Website"]')).toHaveAttribute("src", "https://example.invalid/site");
  });

  test("items set to open in a modal show a compact message", async ({ page, world }) => {
    const modal = [clue("clue-1", { linkBehavior: "modal" }), clue("clue-2")];
    await world.seed({ extraAssets: clueAssets(modal), assetData: hunt({ clues: modal }) });
    await page.goto(clueUrl(world, "clue-1"));

    await expect(page.getByRole("heading", { name: "You discovered an item. Progress: 1 of 2 completed." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Congratulations!" })).toHaveCount(0);
  });

  test("an item that can't be loaded shows an error instead of spinning forever", async ({ page, world }) => {
    test.fail(true, "EXP-439: the /clue page only renders once cluesFound is set, so errors are never shown");
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
    await page.goto(clueUrl(world, "not-a-clue"));

    await expect(page.locator(".text-error")).toContainText("Error", { timeout: 5_000 });
  });
});

test.describe("final challenge", () => {
  const allFound = (world: { progressEntry: (p: any) => Record<string, unknown> }, answerAttempts?: number) =>
    world.progressEntry({ challengeDone: false, cluesFound: ALL_FOUND, ...(answerAttempts && { answerAttempts }) });

  test("a wrong answer counts the attempt and asks to try again", async ({ page, world }) => {
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }), visitorData: allFound(world) });
    await page.goto(world.url("/"));

    await page.getByRole("textbox").fill("springs");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.locator("p.text-error")).toBeVisible();
    await expect.poll(async () => (await world.progress())?.answerAttempts).toBe(1);
    expect((await world.progress())?.challengeDone).toBe(false);
    expect(await world.events("grant-expression")).toEqual([]);
  });

  test("the right answer completes the hunt and unlocks the theme emote", async ({ page, world }) => {
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }), visitorData: allFound(world) });
    await page.goto(world.url("/"));

    // Case and surrounding spaces don't matter.
    await page.getByRole("textbox").fill("  GEARS ");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();
    expect(await world.progress()).toEqual({ challengeDone: true, cluesFound: ALL_FOUND, answerAttempts: 1 });
    expect(await world.events("grant-expression")).toEqual([expect.objectContaining({ expressionId: "expr-robot-1" })]);
    expect(await world.events("particles")).toContainEqual(expect.objectContaining({ particleName: "explosion_float" }));
    expect(await world.events("fire-toast")).toContainEqual(
      expect.objectContaining({ title: "Congratulations", text: "You unlocked a new emote!" }),
    );
    expect((await world.assetData(KEY_ASSET_ID)).leaderboard).toEqual({ [world.profileId]: "E2E Player|3|true|1" });
  });

  test("answering right first time earns Quick Thinker, later attempts don't", async ({ page, world }) => {
    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }), visitorData: allFound(world, 2) });
    await page.goto(world.url("/"));
    await page.getByRole("textbox").fill("gears");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();

    expect((await world.progress())?.answerAttempts).toBe(3);
    expect(await world.events("grant-item")).toEqual([]);
    expect((await world.assetData(KEY_ASSET_ID)).leaderboard[world.profileId]).toBe("E2E Player|3|true|3");

    await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }), visitorData: allFound(world) });
    await page.reload();
    await page.getByRole("textbox").fill("gears");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();
    expect(await world.events("grant-item")).toEqual([expect.objectContaining({ name: "Quick Thinker" })]);
  });

  test("the emote the admin picked is the one granted", async ({ page, world }) => {
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES, challenge: { ...TEXT_CHALLENGE, selectedEmote: "expr-wave" } }),
      visitorData: allFound(world),
    });
    await page.goto(world.url("/"));
    await page.getByRole("textbox").fill("gears");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();

    expect(await world.events("grant-expression")).toEqual([expect.objectContaining({ expressionId: "expr-wave" })]);
  });

  test("multiple choice: only the correct option wins", async ({ page, world }) => {
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES, challenge: MC_CHALLENGE }),
      visitorData: allFound(world),
    });
    await page.goto(world.url("/"));
    await expect(page.getByText("Select the correct answer:")).toBeVisible();
    const option = (name: string) => page.locator("div.flex.items-center", { hasText: name }).getByRole("radio");

    await option("Venus").check();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("p.text-error")).toBeVisible();
    expect((await world.progress())?.challengeDone).toBe(false);

    await option("Mars").check();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();
    expect(await world.progress()).toMatchObject({ challengeDone: true, answerAttempts: 2 });
  });

  test("all that apply: a partial selection is wrong, the exact set wins", async ({ page, world }) => {
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES, challenge: ALL_THAT_APPLY_CHALLENGE }),
      visitorData: allFound(world),
    });
    await page.goto(world.url("/"));
    await expect(page.getByText("Select all that apply:")).toBeVisible();
    const option = (name: string) => page.locator("div.flex.items-center", { hasText: name }).getByRole("checkbox");

    await option("R2-D2").check();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("p.text-error")).toBeVisible();

    await option("WALL-E").check();
    await option("A cat").check();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect.poll(async () => (await world.progress())?.answerAttempts).toBe(2);
    expect((await world.progress())?.challengeDone).toBe(false);

    await option("A cat").uncheck();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();
  });

  test("restarting clears progress and the leaderboard row, and shows the hunt again", async ({ page, world }) => {
    test.fail(true, "EXP-367: /restart-challenge answers totalClues: 0, so the page says the hunt isn't configured");
    await world.seed({
      extraAssets: clueAssets(CLUES),
      assetData: hunt({ clues: CLUES, leaderboard: { "someone-else": "Someone|3|true|1" } }),
      visitorData: world.progressEntry({ challengeDone: true, cluesFound: ALL_FOUND, answerAttempts: 1 }),
    });
    await page.goto(world.url("/"));
    await expect(page.getByText("Nice one! You completed the challenge!")).toBeVisible();

    await page.getByRole("button", { name: "Restart Scavenger Hunt" }).click();

    await expect.poll(async () => await world.progress()).toEqual({ challengeDone: false, cluesFound: [], answerAttempts: 0 });
    expect((await world.assetData(KEY_ASSET_ID)).leaderboard).toEqual({ "someone-else": "Someone|3|true|1" });
    await expect(page.getByRole("heading", { name: "Completed 0 of 3" })).toBeVisible({ timeout: 5_000 });
  });
});
