import { Request, Response } from "express";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  USER_UPLOADS_PREFIX,
  errorHandler,
  getBucket,
  getCredentials,
  getS3Client,
  parseUploadKey,
  publicUrlForKey,
} from "../utils/index.js";

// GET /uploads
// Returns every image under userUploads/ with owner + display-name metadata.
// The client filters by name + optionally by ownership; the server doesn't
// pre-filter so admins can browse images uploaded by others (but can only
// delete their own — enforced by handleDeleteUpload).
export const handleListUploads = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const myProfileId = credentials.profileId;

    const client = getS3Client();
    const items: {
      key: string;
      url: string;
      fileName: string;
      ownerProfileId: string;
      ownedByMe: boolean;
      size: number;
      lastModified: string | null;
    }[] = [];

    let continuationToken: string | undefined;
    // Hard ceiling so a runaway bucket never DOSes the picker. 1000 is the
    // S3 page size and is plenty for a single-app upload area.
    const MAX_PAGES = 5;
    for (let i = 0; i < MAX_PAGES; i++) {
      const out = await client.send(
        new ListObjectsV2Command({
          Bucket: getBucket(),
          Prefix: USER_UPLOADS_PREFIX,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of out.Contents || []) {
        if (!obj.Key) continue;
        const parsed = parseUploadKey(obj.Key);
        if (!parsed) continue; // skip orphan keys that don't match our naming convention
        items.push({
          key: obj.Key,
          url: publicUrlForKey(obj.Key),
          fileName: parsed.fileName,
          ownerProfileId: parsed.ownerProfileId,
          ownedByMe: parsed.ownerProfileId === myProfileId,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified ? obj.LastModified.toISOString() : null,
        });
      }
      if (!out.IsTruncated) break;
      continuationToken = out.NextContinuationToken;
    }

    // Most recent first.
    items.sort((a, b) => {
      const aT = a.lastModified || "";
      const bT = b.lastModified || "";
      return bT.localeCompare(aT);
    });

    return res.json({ success: true, items });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleListUploads",
      message: "Error listing uploads",
      req,
      res,
    });
  }
};
