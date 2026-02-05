import { Credentials } from "../types.js";
import { getCachedInventoryItems } from "./inventoryCache.js";
import { VisitorInventory } from "./getVisitorBadges.js";
import { standardizeError } from "./standardizeError.js";

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
        console.error(`Error firing toast for badge ${badgeName}:`, standardizeError(error).message),
      );

    return { success: true, awarded: true };
  } catch (error) {
    console.error(`Error awarding badge ${badgeName}:`, standardizeError(error).message);
    return { success: false, awarded: false };
  }
};
