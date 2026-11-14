import { INTERACTIVE_KEY } from "../../constants";
import { KEY_ASSET_ID, MC_CHALLENGE, PNG_DATA_URL, clue, clueAssets, expect, hunt, test } from "../../fixtures";

const CLUES = [clue("clue-1"), clue("clue-2"), clue("clue-3")];
const ALL_FOUND = ["clue-1", "clue-2", "clue-3"];

// Known bugs, tracked in EXP-439. test.fail() keeps the suite green while a bug exists and turns red
// once it's fixed, so the marker is removed together with the fix.

test.describe("admin endpoints reject players", () => {
  const calls = [
    { name: "change the challenge answer", method: "post", path: "/update-challenge", data: { answer: "hacked", text: "Q", imgUrl: "" } },
    { name: "rewrite an item", method: "post", path: "/update-clue", data: { assetId: "clue-1", text: "Hacked", imgUrl: "https://example.invalid/x.png", contentUrl: "", mediaType: "image", linkBehavior: "drawer" } },
    { name: "remove an item from the world", method: "post", path: "/remove-clue", data: { clue: { id: "clue-1" } } },
    { name: "reset the item list", method: "post", path: "/reset-clues" },
    { name: "drop a new item", method: "post", path: "/add-new-clue" },
    { name: "walk to an item", method: "post", path: "/walk-up-to-clue-asset", data: { clue: { id: "clue-3" } } },
    { name: "upload an image to S3", method: "post", path: "/uploads", data: { filename: "a.png", contentType: "image/png", data: PNG_DATA_URL } },
    { name: "read the admin config with the answer", method: "get", path: "/config" },
  ] as const;

  for (const call of calls) {
    test(call.name, async ({ request, world }) => {
      test.fail(true, "EXP-439: no admin route checks visitor.isAdmin");
      await world.seed({ isAdmin: false, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
      const before = await world.state();

      const response = await request[call.method](world.api(call.path), { data: "data" in call ? call.data : undefined });

      expect(response.ok()).toBe(false);
      expect(await response.text()).not.toContain("gears");
      const after = await world.state();
      expect(after.assets).toEqual(before.assets);
      expect(after.events).toEqual([]);
      expect((await world.s3()).log).toEqual([]);
    });
  }

  test("players can't list or delete uploads", async ({ request, world }) => {
    test.fail(true, "EXP-439: GET/DELETE /api/uploads never check visitor.isAdmin");
    await world.seed({ isAdmin: false, assetData: hunt({ clues: CLUES }) });
    const key = `userUploads/${INTERACTIVE_KEY}/${world.profileId}_old.png`;
    await world.seedS3({ [key]: { bytes: 5 } });

    expect((await request.get(world.api("/uploads"))).ok()).toBe(false);
    expect((await request.delete(world.api("/uploads"), { data: { key } })).ok()).toBe(false);
    expect((await world.s3()).log).toEqual([]);
  });
});

test("the challenge sent to players doesn't include the answer", async ({ request, world }) => {
  test.fail(true, "EXP-439: GET /api/challenge returns challenge.answer and correctAnswers to every player");
  await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
  const text = await (await request.get(world.api("/challenge"))).text();
  expect(text).not.toContain("gears");

  await world.seed({ extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES, challenge: MC_CHALLENGE }) });
  const body = await (await request.get(world.api("/challenge"))).json();
  expect(body.challenge).not.toHaveProperty("correctAnswers");
});

test("admins do get the answer in the challenge settings", async ({ request, world }) => {
  await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });

  const body = await (await request.get(world.api("/config"))).json();

  expect(body.challenge.answer).toBe("gears");
});

test("the final question can't be answered before every item is found", async ({ request, world }) => {
  test.fail(true, "EXP-439: /api/answer-challenge never checks cluesFound");
  await world.seed({
    extraAssets: clueAssets(CLUES),
    assetData: hunt({ clues: CLUES }),
    visitorData: world.progressEntry({ challengeDone: false, cluesFound: ["clue-1"] }),
  });

  const response = await request.post(world.api("/answer-challenge"), { data: { answer: "gears" } });

  expect((await response.json()).isCorrect).not.toBe(true);
  expect((await world.progress())?.challengeDone).toBe(false);
  expect(await world.events("grant-expression")).toEqual([]);
  expect((await world.assetData(KEY_ASSET_ID)).leaderboard?.[world.profileId]).toBeUndefined();
});

test("a hunt whose question isn't set up can't be won with an empty answer", async ({ request, world }) => {
  test.fail(true, "EXP-439: the placeholder challenge has answer \"\", so an empty answer is graded correct");
  await world.seed({
    extraAssets: clueAssets(CLUES),
    assetData: hunt({ clues: CLUES, challenge: null }),
    visitorData: world.progressEntry({ challengeDone: false, cluesFound: ALL_FOUND }),
  });

  const response = await request.post(world.api("/answer-challenge"), { data: { answer: "" } });

  expect((await response.json()).isCorrect).not.toBe(true);
  expect(await world.events("grant-expression")).toEqual([]);
});

test("answering again after completing doesn't repeat the rewards", async ({ request, world }) => {
  test.fail(true, "EXP-439: /api/answer-challenge doesn't check challengeDone, so rewards and attempts repeat");
  await world.seed({
    extraAssets: clueAssets(CLUES),
    assetData: hunt({ clues: CLUES, leaderboard: {} }),
    visitorData: world.progressEntry({ challengeDone: true, cluesFound: ALL_FOUND, answerAttempts: 1 }),
  });

  await request.post(world.api("/answer-challenge"), { data: { answer: "gears" } });

  expect(await world.events("grant-expression")).toEqual([]);
  expect(await world.events("particles")).toEqual([]);
  expect((await world.progress())?.answerAttempts).toBe(1);
});

test("remove-clue only removes items, never other assets in the world", async ({ request, world }) => {
  test.fail(true, "EXP-439: /api/remove-clue deletes whatever dropped asset id it is sent");
  await world.seed({
    isAdmin: true,
    extraAssets: { ...clueAssets(CLUES), stage: { id: "stage", uniqueName: "stage", sceneDropId: "other-scene" } },
    assetData: hunt({ clues: CLUES }),
  });

  const response = await request.post(world.api("/remove-clue"), { data: { clue: { id: "stage" } } });

  expect(response.ok()).toBe(false);
  expect(await world.events("delete-asset")).toEqual([]);
});

test("a request signed for another app's public key changes nothing", async ({ request, world }) => {
  await world.seed({ isAdmin: true, extraAssets: clueAssets(CLUES), assetData: hunt({ clues: CLUES }) });
  const before = await world.state();

  const response = await request.post(world.api("/update-challenge", { interactivePublicKey: "someone-else" }), {
    data: { answer: "hacked", text: "Q", imgUrl: "" },
  });

  expect(response.ok()).toBe(false);
  expect((await world.state()).assets).toEqual(before.assets);
});
