import { Request, Response } from "express";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  AllowedImageContentType,
  MAX_UPLOAD_BYTES,
  buildUploadKey,
  decodeBase64Image,
  errorHandler,
  getCredentials,
  sanitizeFilename,
  uploadImageToS3,
} from "../utils/index.js";

// POST /uploads
// Body: { filename: string; contentType: string; data: string }
//   - `data` is either a `data:image/png;base64,…` URL or a bare base64 string
//
// The client base64-encodes the file and POSTs it here; the server decodes,
// validates against the MIME allow-list and size cap, sanitizes the filename
// into the `userUploads/{profileId}_{filename}` key shape, and writes to S3.
// Mirrors the bulletin-board flow so the bucket itself can stay private (no
// browser CORS or public bucket policy required).
export const handleUploadImage = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, interactivePublicKey } = credentials;
    const { filename, contentType, data } = req.body as {
      filename?: string;
      contentType?: string;
      data?: string;
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
    if (!data || typeof data !== "string") {
      return res.status(400).json({ success: false, message: "data is required" });
    }

    const buffer = decodeBase64Image(data);
    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid base64 payload" });
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(413).json({
        success: false,
        message: `File too large. Max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      });
    }

    const safeName = sanitizeFilename(filename, contentType as AllowedImageContentType);
    const key = buildUploadKey(interactivePublicKey, profileId, safeName);

    const { publicUrl } = await uploadImageToS3(buffer, key, contentType as AllowedImageContentType);

    return res.json({ success: true, key, publicUrl });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUploadImage",
      message: "Error uploading image",
      req,
      res,
    });
  }
};
