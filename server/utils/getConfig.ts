import { standardizeError } from "./standardizeError.js";
import { DroppedAsset, World } from "./topiaInit.js";
import { ClueType, Credentials, KeyAssetDataObjectType, WorldDataObjectType, WorldSceneIndexType } from "../types.js";
import { DroppedAssetInterface, WorldInterface } from "@rtsdk/topia";
import { getClueDroppedAssets } from "./getClueDroppedAssets.js";

// World data object shape (post-migration):
//   { [sceneDropId]: { keyAssetId } }
//
// Legacy worlds still carry the old shape:
//   { scenes: { [sceneDropId]: { keyAssetId, theme, challenge, clues, ... } } }
//
// `IWorld` describes both — the new-shape entries live at the top level while
// the legacy `scenes` map is optional and only present until the in-line
// migration below (see `migrateLegacyWorldScene`) finishes its work.
interface IWorld extends WorldInterface {
  dataObject: {
    scenes?: {
      [sceneDropId: string]: Partial<WorldDataObjectType>;
    };
    [sceneDropId: string]: unknown;
  };
}

// Locate the ScavengerHunt key asset for this scene. Prefers the cheap path
// (credentials say the user clicked the key asset itself), falls back to a
// scene-wide scan keyed on uniqueName.
const resolveKeyAsset = async (world: IWorld, credentials: Credentials): Promise<DroppedAssetInterface> => {
  const { assetId, sceneDropId, uniqueName, urlSlug } = credentials;
  if (uniqueName === "ScavengerHunt") {
    return DroppedAsset.create(assetId, urlSlug, { credentials });
  }
  const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });
  const keyAsset = droppedAssets.find((asset) => asset.uniqueName === "ScavengerHunt");
  if (!keyAsset) throw "No key asset found with unique name 'ScavengerHunt' in this scene.";
  return keyAsset;
};

// One-shot migration for a single scene: copy any legacy world-side fields
// onto the key asset (without clobbering anything the key asset already
// has), then collapse the world entry to the new `{ keyAssetId }` shape.
// Idempotent — safe to call repeatedly; only runs the actual writes when the
// legacy `scenes.{sceneDropId}` entry still exists.
const migrateLegacyWorldScene = async ({
  world,
  keyAsset,
  keyAssetId,
  sceneDropId,
}: {
  world: IWorld;
  keyAsset: DroppedAssetInterface;
  keyAssetId: string;
  sceneDropId: string;
}): Promise<void> => {
  const legacyScene = world.dataObject?.scenes?.[sceneDropId];
  if (!legacyScene) return;

  // Refresh the key asset's data so we know which fields to preserve.
  await keyAsset.fetchDataObject();
  const keyAssetData = (keyAsset.dataObject || {}) as KeyAssetDataObjectType;

  const fieldsToWrite: Record<string, unknown> = {};
  if (legacyScene.challenge && !keyAssetData.challenge) {
    fieldsToWrite.challenge = legacyScene.challenge;
  }
  if (legacyScene.theme && !keyAssetData.theme) {
    fieldsToWrite.theme = legacyScene.theme;
  }
  if (legacyScene.buildableAssetUniqueName && !keyAssetData.buildableAssetUniqueName) {
    fieldsToWrite.buildableAssetUniqueName = legacyScene.buildableAssetUniqueName;
  }
  if (legacyScene.clues && Object.keys(legacyScene.clues).length > 0 && !keyAssetData.clues) {
    fieldsToWrite.clues = legacyScene.clues;
  }

  if (Object.keys(fieldsToWrite).length > 0) {
    await keyAsset.updateDataObject(fieldsToWrite, {});
  }

  // Collapse the world entry to the new shape and drop the stale legacy
  // scene record so this migration won't re-trigger on the next read.
  const lockId = `${sceneDropId}-migrate-${new Date(Math.round(Date.now() / 60000) * 60000)}`;
  await world.updateDataObject(
    {
      [sceneDropId]: { keyAssetId },
      [`scenes.${sceneDropId}`]: null,
    },
    { lock: { lockId, releaseLock: true } },
  );
};

export const getConfig = async ({ credentials }: { credentials: Credentials }) => {
  try {
    const { sceneDropId, urlSlug } = credentials;

    const world = (await World.create(urlSlug, { credentials })) as IWorld;
    await world.fetchDataObject();

    // Resolve keyAssetId from the new top-level shape, then legacy `scenes.*`,
    // then by scanning the scene for the asset by uniqueName.
    const newIndex = world.dataObject?.[sceneDropId] as WorldSceneIndexType | undefined;
    const legacyScene = world.dataObject?.scenes?.[sceneDropId];
    let keyAssetId: string | undefined =
      (newIndex && typeof newIndex === "object" && newIndex.keyAssetId) || legacyScene?.keyAssetId;

    let keyAsset: DroppedAssetInterface;
    if (keyAssetId) {
      keyAsset = await DroppedAsset.create(keyAssetId, urlSlug, { credentials });
    } else {
      keyAsset = await resolveKeyAsset(world, credentials);
      keyAssetId = keyAsset.id;
      // Seed the new top-level world index so subsequent reads skip the scan.
      const lockId = `${sceneDropId}-${new Date(Math.round(Date.now() / 60000) * 60000)}`;
      await world.updateDataObject({ [sceneDropId]: { keyAssetId } }, { lock: { lockId, releaseLock: true } });
    }

    // Bootstrap a brand-new key asset's data object on first visit — if it
    // has no theme yet, defer to the legacy data we may be about to migrate.
    // (If neither legacy nor new data exists, we can't seed a default theme
    // without admin input; the existing flow expected `theme` to already be
    // on the key asset, so we keep that contract.)
    await keyAsset.fetchDataObject();
    let keyAssetData = (keyAsset.dataObject || {}) as KeyAssetDataObjectType;

    // Inline migration: copy legacy world-side fields to the key asset and
    // collapse the legacy world scene entry. No-op if already migrated.
    await migrateLegacyWorldScene({ world, keyAsset, keyAssetId, sceneDropId });

    // Refresh in case migration wrote anything.
    await keyAsset.fetchDataObject();
    keyAssetData = (keyAsset.dataObject || {}) as KeyAssetDataObjectType;

    if (!keyAssetData.theme) {
      throw "Key asset is missing required theme in its data object.";
    }

    // Ensure `clues` is populated and in the current shape. Re-derive from
    // the scene's dropped assets whenever the stored value is:
    //   - Missing entirely (brand-new world, no migration to run).
    //   - A positional array (`[{ contentImgUrl, text }, ...]` with no
    //     per-entry `id`) — very old hunts. Text/content is backfilled
    //     positionally from the legacy array so nothing is lost.
    //   - A malformed object — e.g. `{ "undefined": {...} }` from a partial
    //     migration where `droppedAsset.id` was undefined at write time,
    //     or any entry whose key doesn't match its own `id`. In this case
    //     the scene has clue assets that carry the legacy content on their
    //     own data objects, and `getClueDroppedAssets` already reads that.
    //
    // Without this, `clues[assetId]` lookups in every caller return
    // undefined and the visitor sees "No clue asset found" or a truncated
    // clue set.
    const existingClues = keyAssetData.clues as unknown;
    const cluesIsObject =
      !!existingClues && typeof existingClues === "object" && !Array.isArray(existingClues);
    const cluesEntries: [string, Partial<ClueType>][] = cluesIsObject
      ? Object.entries(existingClues as Record<string, Partial<ClueType>>)
      : [];
    const cluesMalformed =
      cluesIsObject &&
      cluesEntries.length > 0 &&
      cluesEntries.some(([key, clue]) => !clue?.id || key !== clue.id);

    const needsCluesDerivation = !existingClues || Array.isArray(existingClues) || cluesMalformed;
    if (needsCluesDerivation) {
      // First pass: themed uniqueName fetch — the fast path for hunts that
      // followed the `{keyAsset.uniqueName}_{theme}_clue` convention.
      const derivedClues: Record<string, ClueType> = await getClueDroppedAssets({
        sceneDropId,
        uniqueName: `${keyAsset.uniqueName}_${keyAssetData.theme}_clue`,
        world,
      });

      // Fallback: very old hunts dropped clue assets with a different (or
      // no) uniqueName, so the themed fetch returns empty. Scan every asset
      // in the scene and identify legacy clue assets by their distinctive
      // data-object shape — each carries a full copy of the hunt's `clues`
      // array. Only runs once per scene (subsequent loads hit the fast
      // path once we persist below).
      if (Object.keys(derivedClues).length === 0) {
        const allSceneAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });
        // Firebase-style push IDs sort lexically to creation order — gives us
        // a deterministic positional match against the legacy `clues` array.
        const candidates = allSceneAssets
          .filter((a) => a.id !== keyAssetId)
          .sort((a, b) => (a.id || "").localeCompare(b.id || ""));

        for (const asset of candidates) {
          await asset.fetchDataObject();
          const d = (asset.dataObject || {}) as Partial<ClueType> & { clues?: unknown; isVideo?: boolean };
          const legacyArray = Array.isArray(d.clues) ? (d.clues as Partial<ClueType>[]) : null;
          // Skip assets that don't look like legacy clue assets.
          if (!legacyArray && !d.contentUrl && !d.contentImgUrl && !d.text) continue;

          const idx = Object.keys(derivedClues).length;
          const legacyEntry = legacyArray?.[idx];
          derivedClues[asset.id] = {
            id: asset.id,
            imgUrl: d.imgUrl || asset.topLayerURL || asset.bottomLayerURL || "",
            text: d.text || legacyEntry?.text || `Clue ${idx + 1}`,
            contentUrl:
              d.contentUrl || d.contentImgUrl || legacyEntry?.contentUrl || legacyEntry?.contentImgUrl || "",
            mediaType: d.mediaType || (d.isVideo ? "video" : "image"),
            linkBehavior: d.linkBehavior || "drawer",
          };
        }
      }

      if (Array.isArray(existingClues)) {
        const derivedIds = Object.keys(derivedClues);
        existingClues.forEach((legacy, i) => {
          const id = derivedIds[i];
          if (!id) return;
          const target = derivedClues[id];
          if (!target.text && legacy?.text) target.text = legacy.text;
          const legacyContent = legacy?.contentUrl || legacy?.contentImgUrl;
          if (!target.contentUrl && legacyContent) target.contentUrl = legacyContent;
        });
      }

      // Only overwrite when derivation produced at least as many entries as
      // we currently have — protects against wiping data when neither the
      // themed fetch nor the scene-wide scan surface anything.
      const existingCount = Array.isArray(existingClues) ? existingClues.length : cluesEntries.length;
      const derivedCount = Object.keys(derivedClues).length;
      const canPersist = derivedCount >= existingCount || existingCount === 0;
      if (canPersist) {
        await keyAsset.updateDataObject({ clues: derivedClues }, {});
        keyAssetData = { ...keyAssetData, clues: derivedClues };
      }
    }

    // Merged view returned to callers — every field they used to read from
    // the world's scene entry, now sourced from the key asset.
    const fallbackImgUrl =
      keyAssetData.theme === "custom"
        ? "https://sdk-scavenger-hunt.s3.us-east-1.amazonaws.com/IMG_Start.png"
        : `https://sdk-scavenger-hunt.s3.amazonaws.com/${keyAssetData.theme}/IMG_Start.png`;

    // Repair the legacy bare-filename challenge imgUrl. Older hunts stored
    // `challenge.imgUrl: "IMG_Start.png"` — a placeholder that assumed the
    // client would prefix the S3 base + theme. That prefixing no longer
    // happens, so the raw string renders as a broken image. Rewrite to the
    // themed URL and persist so this only runs once per key asset.
    if (keyAssetData.challenge?.imgUrl === "IMG_Start.png") {
      const repairedChallenge = { ...keyAssetData.challenge, imgUrl: fallbackImgUrl };
      await keyAsset.updateDataObject({ challenge: repairedChallenge }, {});
      keyAssetData = { ...keyAssetData, challenge: repairedChallenge };
    }

    const dataObject: WorldDataObjectType = {
      sceneDropId,
      keyAssetId,
      theme: keyAssetData.theme,
      buildableAssetUniqueName: keyAssetData.buildableAssetUniqueName,
      challenge: keyAssetData.challenge ?? {
        answer: "",
        text: "This challenge hasn't been set up yet. Please check back later.",
        imgUrl: fallbackImgUrl,
      },
      clues: keyAssetData.clues ?? {},
    };

    return { keyAssetId, dataObject, world, keyAsset };
  } catch (error) {
    throw standardizeError(error);
  }
};
