import { Request, Response } from "express";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  errorHandler,
  getBucket,
  getCredentials,
  getS3Client,
  isOwnedByProfile,
  USER_UPLOADS_PREFIX,
} from "../utils/index.js";

// DELETE /uploads
// Body: { key: string }
//
// Admins may only delete files they uploaded — enforced via the profileId
// prefix baked into the S3 key. Mismatched keys return 403 without touching
// S3, so a malicious client can't probe the bucket via deletes.
export const handleDeleteUpload = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { key } = req.body as { key?: string };

    if (!key || typeof key !== "string" || !key.startsWith(USER_UPLOADS_PREFIX)) {
      return res.status(400).json({ success: false, message: "Invalid upload key" });
    }
    if (!isOwnedByProfile(key, profileId)) {
      return res.status(403).json({ success: false, message: "You can only delete your own uploads" });
    }

    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );

    return res.json({ success: true, key });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleDeleteUpload",
      message: "Error deleting upload",
      req,
      res,
    });
  }
};
