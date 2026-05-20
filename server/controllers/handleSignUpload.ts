import { Request, Response } from "express";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  AllowedImageContentType,
  MAX_UPLOAD_BYTES,
  buildUploadKey,
  errorHandler,
  getBucket,
  getCredentials,
  getS3Client,
  publicUrlForKey,
  sanitizeFilename,
} from "../utils/index.js";

const ONE_HOUR_SECONDS = 60 * 60;

// POST /uploads/sign
// Body: { filename: string; contentType: string; size?: number }
// Returns: { url: string; fields: Record<string, string>; key: string; publicUrl: string }
//
// The client POSTs FormData to `url` with the returned `fields` plus the
// file under the "file" field. S3 enforces the content-length-range and
// exact content-type via the policy embedded in the presigned post.
export const handleSignUpload = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { filename, contentType, size } = req.body as {
      filename?: string;
      contentType?: string;
      size?: number;
    };

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ success: false, message: "filename is required" });
    }
    if (!contentType || !ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType as AllowedImageContentType)) {
      return res.status(400).json({
        success: false,
        message: `contentType must be one of: ${ALLOWED_IMAGE_CONTENT_TYPES.join(", ")}`,
      });
    }
    if (typeof size === "number" && size > MAX_UPLOAD_BYTES) {
      return res.status(400).json({
        success: false,
        message: `File too large. Max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      });
    }

    const safeName = sanitizeFilename(filename, contentType as AllowedImageContentType);
    const key = buildUploadKey(profileId, safeName);

    const { url, fields } = await createPresignedPost(getS3Client(), {
      Bucket: getBucket(),
      Key: key,
      Conditions: [
        ["content-length-range", 0, MAX_UPLOAD_BYTES],
        ["eq", "$Content-Type", contentType],
      ],
      Fields: { "Content-Type": contentType },
      Expires: ONE_HOUR_SECONDS,
    });

    return res.json({
      success: true,
      url,
      fields,
      key,
      publicUrl: publicUrlForKey(key),
      maxBytes: MAX_UPLOAD_BYTES,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleSignUpload",
      message: "Error signing upload",
      req,
      res,
    });
  }
};
