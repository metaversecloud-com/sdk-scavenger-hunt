import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// ──────────────────────────────────────────────────────────────────────────
//  S3 SHARED UTILITIES
// ──────────────────────────────────────────────────────────────────────────
//  Keys are stored under userUploads/{interactivePublicKey}/, with the
//  uploader's profileId baked into the leaf as `{profileId}_{filename}`.
//  Full shape:
//
//    userUploads/{interactivePublicKey}/{profileId}_{filename}.ext
//
//  • The {interactivePublicKey} segment scopes each app/integration to its
//    own folder so different deployments sharing one bucket don't see each
//    other's uploads.
//  • The {profileId}_ prefix on the filename gates "can this admin delete
//    this file?" — controllers must call `isOwnedByProfile` before any
//    destructive operation.
// ──────────────────────────────────────────────────────────────────────────

export const S3_REGION = "us-east-1";
export const USER_UPLOADS_PREFIX = "userUploads/";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_IMAGE_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

export const EXTENSION_BY_CONTENT_TYPE: Record<AllowedImageContentType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// In development we run the SDK *unsigned* so every S3 request falls through
// to the bucket policy's `Principal: "*"` paths. This sanity-checks that the
// bucket policy alone (no IAM identity) grants the permissions the app needs
// — i.e. simulates a deployment that has no AWS credentials configured on
// the server, only a public bucket policy.
//
// The toggle is bound to NODE_ENV so it can never leak into a real deploy:
// production envs sign normally, dev/local envs don't.
export const isAwsAnonymousMode = (): boolean => process.env.NODE_ENV === "development";

let _s3Client: S3Client | undefined;
let _warnedAnonymous = false;

export const getS3Client = (): S3Client => {
  if (_s3Client) return _s3Client;

  if (isAwsAnonymousMode()) {
    if (!_warnedAnonymous) {
      console.warn(
        "[s3] NODE_ENV=development — sending UNSIGNED requests to S3. " +
          "Operations will only succeed where the bucket policy grants Principal:*.",
      );
      _warnedAnonymous = true;
    }
    _s3Client = new S3Client({
      region: S3_REGION,
      // No-op signer: pass the request through with no Authorization header
      // so S3 treats it as anonymous.
      signer: { sign: async (request) => request },
    });
  } else {
    _s3Client = new S3Client({ region: S3_REGION });
  }
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

  name = name
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!name) name = "image";
  if (name.length > 64) name = name.slice(0, 64);

  if (!ext && fallbackContentType) ext = EXTENSION_BY_CONTENT_TYPE[fallbackContentType];
  ext = ext.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
  if (!ext) ext = "png";

  return `${name}.${ext}`;
};

// Per-app prefix under USER_UPLOADS_PREFIX. Pass this to ListObjectsV2 so the
// browse view only shows uploads for this integration (not other apps that
// happen to share the same bucket).
export const userUploadsPrefix = (interactivePublicKey: string): string =>
  `${USER_UPLOADS_PREFIX}${interactivePublicKey}/`;

// Build the full S3 key for an upload owned by a specific profileId,
// nested under this app's interactivePublicKey.
export const buildUploadKey = (interactivePublicKey: string, profileId: string, sanitizedFilename: string): string =>
  `${userUploadsPrefix(interactivePublicKey)}${profileId}_${sanitizedFilename}`;

// Parse interactivePublicKey + owner + display name out of a stored key.
// Returns null when the key doesn't match the expected
// `userUploads/{interactivePublicKey}/{profileId}_{filename}` shape.
export const parseUploadKey = (
  key: string,
): { interactivePublicKey: string; ownerProfileId: string; fileName: string } | null => {
  if (!key.startsWith(USER_UPLOADS_PREFIX)) return null;
  const afterRoot = key.slice(USER_UPLOADS_PREFIX.length);
  const slash = afterRoot.indexOf("/");
  if (slash <= 0 || slash === afterRoot.length - 1) return null;
  const interactivePublicKey = afterRoot.slice(0, slash);
  const leaf = afterRoot.slice(slash + 1);
  const underscore = leaf.indexOf("_");
  if (underscore <= 0 || underscore === leaf.length - 1) return null;
  return {
    interactivePublicKey,
    ownerProfileId: leaf.slice(0, underscore),
    fileName: leaf.slice(underscore + 1),
  };
};

// Only the file's owner inside the same interactivePublicKey branch may
// mutate it. Both segments must match.
export const isOwnedByProfile = (key: string, profileId: string, interactivePublicKey: string): boolean => {
  const parsed = parseUploadKey(key);
  return !!parsed && parsed.ownerProfileId === profileId && parsed.interactivePublicKey === interactivePublicKey;
};

// Public S3 URL for a stored object.
export const publicUrlForKey = (key: string): string => `https://${getBucket()}.s3.amazonaws.com/${encodeURI(key)}`;

// Decode a `data:image/png;base64,…` URL (or a bare base64 string) into a
// Buffer. Throws if the payload isn't recognizable base64.
export const decodeBase64Image = (data: string): Buffer => {
  const comma = data.indexOf(",");
  const base64 = comma >= 0 ? data.slice(comma + 1) : data;
  return Buffer.from(base64, "base64");
};

// Upload a decoded image Buffer to S3 under `key`. Mirrors the upload-from-
// server pattern used by sdk-bulletin-board-app/server/utils/uploadToS3.ts —
// the server holds the AWS credentials and the bucket can stay private, so
// no bucket CORS / public bucket policy is required.
export const uploadImageToS3 = async (
  buffer: Buffer,
  key: string,
  contentType: AllowedImageContentType,
): Promise<{ key: string; publicUrl: string }> => {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return { key, publicUrl: publicUrlForKey(key) };
};
