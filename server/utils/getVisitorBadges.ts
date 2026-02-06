import { VisitorInterface } from "@rtsdk/topia";

export type VisitorBadgeRecord = {
  [name: string]: {
    id: string;
    name: string;
    icon: string;
  };
};

export type VisitorInventory = {
  badges: VisitorBadgeRecord;
};

/**
 * Extract badges from visitor's inventory items
 * Call visitor.fetchInventoryItems() before using this function
 */
export const getVisitorBadges = async (visitor: VisitorInterface): Promise<VisitorInventory> => {
  await visitor.fetchInventoryItems();

  const visitorInventory: VisitorInventory = { badges: {} };

  for (const visitorItem of visitor.inventoryItems) {
    const { id, status, item } = visitorItem;
    const { name, type, image_url = "" } = item || {};

    if (status === "ACTIVE" && type === "BADGE" && name) {
      visitorInventory.badges[name] = {
        id,
        name,
        icon: image_url,
      };
    }
  }

  return visitorInventory;
};
