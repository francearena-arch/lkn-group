import 'server-only';
import { S3Client } from '@aws-sdk/client-s3';

export const BUCKET = 'lkn-demo-documents';

export function storageClient() {
  for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_ENDPOINT_URL_S3', 'AWS_REGION']) {
    if (!process.env[key]) throw new Error('Storage configuration is incomplete');
  }
  return new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    forcePathStyle: true,
    maxAttempts: 2
  });
}
