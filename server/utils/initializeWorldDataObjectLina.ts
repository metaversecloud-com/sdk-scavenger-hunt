// import { errorHandler } from "./errorHandler";
// import { getThemeEnvVars } from './getThemeEnvVars';
// import { Credentials } from "../types";

// export const initializeWorldDataObject = async ({ credentials, sceneDropId, world }: { credentials: Credentials, sceneDropId: string, world: any }) => {
//   try {
//     await world.fetchDataObject();

//     const payload = {
//       anchorAssets: [],
//       messages: {},
//       placedAssets: [],
//       theme: {},
//       usedSpaces: [],
//     };

//     if (!world.dataObject || !world.dataObject?.scenes || !world.dataObject?.scenes?.[sceneDropId]) {
//       const { theme } = getThemeEnvVars(process.env.DEFAULT_THEME)
//       payload.theme = theme

//       const assetsList = await world.fetchDroppedAssetsBySceneDropId({
//         sceneDropId: credentials.sceneDropId,
//       })
//       payload.anchorAssets = assetsList
//         .filter(a => a.uniqueName === "anchor")
//         .map(({ id }) => (id));
//     }

//     const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
//     if (!world.dataObject || !world.dataObject?.scenes) {
//       await world.setDataObject(
//         {
//           scenes: {
//             [sceneDropId]: { ...payload },
//           },
//         },
//         { lock: { lockId, releaseLock: true } },
//       );
//     } else if (!world.dataObject?.scenes?.[sceneDropId]) {
//       await world.updateDataObject(
//         {
//           [`scenes.${sceneDropId}`]: { ...payload },
//         },
//         { lock: { lockId, releaseLock: true } },
//       );
//     }
//     return;
//   } catch (error) {
//     errorHandler({
//       error,
//       functionName: "initializeWorldDataObject",
//       message: "Error initializing world data object",
//     });
//     return await world.fetchDataObject();
//   }
// };
