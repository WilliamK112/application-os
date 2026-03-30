/**
 * S3/R2 compatible storage utility.
 * Uses presigned PUT URLs for direct browser-to-storage uploads.
 * Falls back to local/mock mode when S3 is not configured.
 */

export interface UploadCredentials {
  key: string;
  uploadUrl: string;   // presigned PUT URL
  publicUrl: string;   // final public access URL
  fields?: Record<string, string>;
}

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlBase: string;
}

function isConfigured(): StorageConfig | null {
  const endpoint = process.env.APP_OS_S3_ENDPOINT?.trim();
  const region = process.env.APP_OS_S3_REGION?.trim() || "auto";
  const bucket = process.env.APP_OS_S3_BUCKET?.trim();
  const accessKeyId = process.env.APP_OS_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.APP_OS_S3_SECRET_ACCESS_KEY?.trim();
  const publicUrlBase = process.env.APP_OS_S3_PUBLIC_URL_BASE?.trim();

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrlBase: publicUrlBase || endpoint,
  };
}

async function buildPresignedUploadUrl(
  config: StorageConfig,
  key: string,
  contentType: string,
): Promise<UploadCredentials> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: false,
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = `${config.publicUrlBase.replace(/\/$/, "")}/${key}`;

  return { key, uploadUrl, publicUrl };
}

export async function generateUploadCredentials(
  fileName: string,
  contentType: string,
  userId: string,
): Promise<UploadCredentials | null> {
  const config = isConfigured();
  if (!config) {
    return null; // local/mock mode
  }

  // Sanitize filename
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const key = `users/${userId}/documents/${timestamp}-${safeName}`;

  return buildPresignedUploadUrl(config, key, contentType);
}

export function isStorageConfigured(): boolean {
  return isConfigured() !== null;
}