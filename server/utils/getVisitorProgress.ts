/**
 * Check visitor's scavenger hunt progress across all worlds
 * Returns counts for different achievements
 */
export const getVisitorProgress = (
  visitorDataObject: any,
): {
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
  // Keys are in format: ${urlSlug}_${sceneDropId}
  for (const key of Object.keys(visitorDataObject)) {
    const data = visitorDataObject[key];

    // Skip non-scavenger-hunt data
    if (!data || typeof data !== "object") continue;
    if (!("challengeDone" in data) && !("cluesFound" in data)) continue;

    // Extract urlSlug from the key (format: urlSlug_sceneDropId)
    const urlSlug = key.split("_")[0];

    // Count completions
    if (data.challengeDone === true) {
      totalCompletions++;
    }

    // Track unique worlds where clues were collected
    if (data.cluesFound && Array.isArray(data.cluesFound) && data.cluesFound.length > 0 && urlSlug.length < 26) {
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
