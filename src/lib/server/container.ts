import { env } from '$env/dynamic/private';
import { AssetService } from './application/assets';
import { DocumentService } from './application/documents';
import { S3AssetStorageAdapter } from './adapters/s3/asset-storage';
import { createS3Client } from './adapters/s3/client';
import { S3DocumentStorageAdapter } from './adapters/s3/document-storage';

const config = {
	endpoint: env.S3_ENDPOINT || 'https://example.invalid',
	region: env.S3_REGION || 'auto',
	bucket: env.S3_BUCKET || '',
	accessKeyId: env.S3_ACCESS_KEY_ID || '',
	secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
	forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true'
};

const client = createS3Client(config);

export const documents = new DocumentService(new S3DocumentStorageAdapter(client, config.bucket));
export const assets = new AssetService(new S3AssetStorageAdapter(client, config.bucket));
