import { standardizeError } from "./standardizeError.js";
import { DroppedAsset, World } from "./topiaInit.js";
import { Credentials, KeyAssetDataObjectType, WorldDataObjectType, WorldSceneIndexType } from "../types.js";
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

    // Ensure `clues` is populated and in the current shape:
    //   - Missing entirely (brand-new world, no migration to run) → derive
    //     from the scene's dropped assets.
    //   - Stored as a positional array (very old hunts: `[{ contentImgUrl,
    //     text }, ...]` with no per-entry `id`) → re-derive keyed by asset
    //     id and positionally backfill text/content from the legacy array so
    //     nothing is lost. Otherwise `clues[assetId]` lookups in every
    //     caller return undefined and clicking a clue asset throws.
    const existingClues = keyAssetData.clues as unknown;
    const needsCluesDerivation = !existingClues || Array.isArray(existingClues);
    if (needsCluesDerivation) {
      const derivedClues = await getClueDroppedAssets({
        sceneDropId,
        uniqueName: `ScavengerHunt_${keyAssetData.theme}_clue`,
        world,
      });

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

      // Don't clobber a non-empty legacy array with an empty derived object
      // (would happen if the scene has no dropped assets matching the theme
      // uniqueName). Leave the legacy data in place for manual recovery.
      const hasDerivedClues = Object.keys(derivedClues).length > 0;
      const canPersist = hasDerivedClues || !Array.isArray(existingClues) || existingClues.length === 0;
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
