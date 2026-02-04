import { Credentials } from "../types.js";
import { getCachedInventoryItems } from "./inventoryCache.js";
import { VisitorInventory } from "./getVisitorBadges.js";
import { errorHandler } from "./errorHandler.js";

/**
 * Award a badge to a visitor if they don't already have it
 */
export const awardBadge = async ({
  credentials,
  visitor,
  visitorInventory,
  badgeName,
}: {
  credentials: Credentials;
  visitor: any;
  visitorInventory: VisitorInventory;
  badgeName: string;
}): Promise<{ success: boolean; awarded?: boolean }> => {
  try {
    // Check if the visitor already has this badge
    if (visitorInventory.badges[badgeName]) {
      return { success: true, awarded: false };
    }

    // Fetch available inventory items from the ecosystem
    const inventoryItems = await getCachedInventoryItems({ credentials });

    // Find the specific badge in the inventory items
    const inventoryItem = inventoryItems?.find((item) => item.name === badgeName && item.type === "BADGE");
    if (!inventoryItem) {
      console.warn(`Badge "${badgeName}" not found in ecosystem inventory`);
      return { success: false, awarded: false };
    }

    // Grant the badge to the visitor
    await visitor.grantInventoryItem(inventoryItem, 1);

    // Display a toast notification
    visitor
      .fireToast({
        groupId: "badge-awarded",
        title: "Badge Earned!",
        text: `You earned the "${badgeName}" badge!`,
      })
      .catch((error: any) =>
        errorHandler({
          error,
          functionName: "awardBadge",
          message: `Error firing toast for badge ${badgeName}`,
        }),
      );

    return { success: true, awarded: true };
  } catch (error) {
    errorHandler({
      error,
      functionName: "awardBadge",
      message: `Error awarding badge ${badgeName}`,
    });
    return { success: false, awarded: false };
  }
};

/**
 * Check visitor's scavenger hunt progress across all worlds
 * Returns counts for different achievements
 */
export const getVisitorProgress = (visitorDataObject: any): {
  totalCompletions: number;
  uniqueWorlds: string[];
  totalCluesCollected: number;
} => {
  let totalCompletions = 0;
  const uniqueWorlds = new Set<string>();
  let totalCluesCollected = 0;

  if (!visitorDataObject) {
    return { totalCompletions: 0, uniqueWorlds: [], totalCluesCollected: 0 };
  }

  // Iterate through all keys in the visitor data object
  // Keys are in format: ${urlSlug}-${sceneDropId}
  for (const key of Object.keys(visitorDataObject)) {
    const data = visitorDataObject[key];

    // Skip non-scavenger-hunt data
    if (!data || typeof data !== "object") continue;
    if (!("challengeDone" in data) && !("cluesFound" in data)) continue;

    // Extract urlSlug from the key (format: urlSlug-sceneDropId)
    const urlSlug = key.split("-")[0];

    // Count completions
    if (data.challengeDone === true) {
      totalCompletions++;
    }

    // Track unique worlds where clues were collected
    if (data.cluesFound && Array.isArray(data.cluesFound) && data.cluesFound.length > 0) {
      uniqueWorlds.add(urlSlug);
      totalCluesCollected += data.cluesFound.length;
    }
  }

  return {
    totalCompletions,
    uniqueWorlds: Array.from(uniqueWorlds),
    totalCluesCollected,
  };
};
