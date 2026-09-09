import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  GET_URL_TTL_SEC,
  PUT_URL_TTL_SEC,
} from '@relay/shared/constants/attachment.constant';
import { config } from '@/config.js';

export type StorageHead = {
  contentLength: number;
  contentType: string | undefined;
};

export type StorageClient = {
  signPutUrl: (key: string, contentType: string) => Promise<string>;
  signGetUrl: (key: string) => Promise<string>;
  headObject: (key: string) => Promise<StorageHead | null>;
  deleteObject: (key: string) => Promise<void>;
};

let testClient: StorageClient | null | undefined;

export function setStorageClientForTest(client: StorageClient | null | undefined) {
  testClient = client;
}

export function isStorageConfigured(): boolean {
  if (testClient !== undefined) return testClient !== null;
  return Boolean(config.s3.bucket && config.s3.accessKey && config.s3.secretKey);
}

export function getStorage(): StorageClient | null {
  if (testClient !== undefined) return testClient;
  if (!isStorageConfigured()) return null;
  return createS3Storage();
}

function createS3Storage(): StorageClient {
  const bucket = config.s3.bucket;
  const credentials = {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  };
  const base = {
    region: config.s3.region,
    credentials,
    forcePathStyle: config.s3.forcePathStyle,
  };
  const internal = new S3Client({
    ...base,
    ...(config.s3.endpoint ? { endpoint: config.s3.endpoint } : {}),
  });
  const publicEndpoint = config.s3.publicEndpoint || config.s3.endpoint;
  const browser = new S3Client({
    ...base,
    ...(publicEndpoint ? { endpoint: publicEndpoint } : {}),
  });

  return {
    async signPutUrl(key, contentType) {
      return getSignedUrl(
        browser,
        new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
        { expiresIn: PUT_URL_TTL_SEC },
      );
    },
    async signGetUrl(key) {
      return getSignedUrl(
        browser,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: GET_URL_TTL_SEC },
      );
    },
    async headObject(key) {
      try {
        const result = await internal.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return {
          contentLength: result.ContentLength ?? 0,
          contentType: result.ContentType,
        };
      } catch {
        return null;
      }
    },
    async deleteObject(key) {
      await internal.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

export function createMemoryStorage(): StorageClient & {
  objects: Map<string, { size: number; contentType: string }>;
} {
  const objects = new Map<string, { size: number; contentType: string }>();
  return {
    objects,
    async signPutUrl(key, contentType) {
      return `http://s3.test/put/${encodeURIComponent(key)}?ct=${encodeURIComponent(contentType)}`;
    },
    async signGetUrl(key) {
      return `http://s3.test/get/${encodeURIComponent(key)}`;
    },
    async headObject(key) {
      const row = objects.get(key);
      if (!row) return null;
      return { contentLength: row.size, contentType: row.contentType };
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
}
