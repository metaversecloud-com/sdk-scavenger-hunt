import { S3Client } from "@aws-sdk/client-s3";

// ──────────────────────────────────────────────────────────────────────────
//  S3 SHARED UTILITIES
// ──────────────────────────────────────────────────────────────────────────
//  Keys are stored flat under USER_UPLOADS_PREFIX, with the uploader's
//  profileId baked into the object key as `{profileId}_{filename}`. That
//  prefix is what gates "can this admin delete this file?" — controllers
//  must call `isOwnedByProfile` before performing destructive ops.
// ──────────────────────────────────────────────────────────────────────────

export const S3_REGION = "us-east-1";
export const USER_UPLOADS_PREFIX = "userUploads/";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

export const EXTENSION_BY_CONTENT_TYPE: Record<AllowedImageContentType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

let _s3Client: S3Client | undefined;

export const getS3Client = (): S3Client => {
  if (!_s3Client) _s3Client = new S3Client({ region: S3_REGION });
  return _s3Client;
};

export const getBucket = (): string => {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET env var is not set");
  return bucket;
};

// Replace anything outside a safe ASCII subset with a dash, collapse runs of
// dashes, and cap length so we don't generate pathological keys. Preserves
// the original extension if present, otherwise falls back to one derived
// from the content type.
export const sanitizeFilename = (raw: string, fallbackContentType?: AllowedImageContentType): string => {
  const base = raw.split("/").pop()?.split("\\").pop() || "image";
  const dot = base.lastIndexOf(".");
  let name = dot > 0 ? base.slice(0, dot) : base;
  let ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : "";

  name = name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  if (!name) name = "image";
  if (name.length > 64) name = name.slice(0, 64);

  if (!ext && fallbackContentType) ext = EXTENSION_BY_CONTENT_TYPE[fallbackContentType];
  ext = ext.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
  if (!ext) ext = "png";

  return `${name}.${ext}`;
};

// Build the full S3 key for an upload owned by a specific profileId.
export const buildUploadKey = (profileId: string, sanitizedFilename: string): string =>
  `${USER_UPLOADS_PREFIX}${profileId}_${sanitizedFilename}`;

// Parse owner + display name out of a stored key. Returns null when the key
// doesn't match the expected `userUploads/{profileId}_{filename}` shape.
export const parseUploadKey = (
  key: string,
): { ownerProfileId: string; fileName: string } | null => {
  if (!key.startsWith(USER_UPLOADS_PREFIX)) return null;
  const rest = key.slice(USER_UPLOADS_PREFIX.length);
  const underscore = rest.indexOf("_");
  if (underscore <= 0 || underscore === rest.length - 1) return null;
  return {
    ownerProfileId: rest.slice(0, underscore),
    fileName: rest.slice(underscore + 1),
  };
};

export const isOwnedByProfile = (key: string, profileId: string): boolean => {
  const parsed = parseUploadKey(key);
  return !!parsed && parsed.ownerProfileId === profileId;
};

// Public S3 URL for a stored object.
export const publicUrlForKey = (key: string): string =>
  `https://${getBucket()}.s3.amazonaws.com/${encodeURI(key)}`;
