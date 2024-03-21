import { errorHandler } from "../errorHandler";

export const initializeDroppedAssetDataObject = async (droppedAsset: any, isKeyAsset: boolean) => {
  try {
    await droppedAsset.fetchDataObject();

    const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (isKeyAsset) {
        if (!droppedAsset.dataObject.isKeyAsset) {
        await droppedAsset.setDataObject(
          {
            analytics: { progress: {} },
            challenge: { answer: "", text: "" },
            isKeyAsset,
          },
          { lock: { lockId } },
        );
      }
    } else {
      if (!droppedAsset.dataObject.imageUrl) {
        await droppedAsset.setDataObject({ imageUrl: "", text: "" }, { lock: { lockId } });
      }
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeDroppedAssetDataObject",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
