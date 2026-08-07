import { S3Client } from '@aws-sdk/client-s3';

export interface S3StorageConfig {
	endpoint: string;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	forcePathStyle: boolean;
}

export function createS3Client(config: S3StorageConfig): S3Client {
	return new S3Client({
		endpoint: config.endpoint,
		region: config.region,
		forcePathStyle: config.forcePathStyle,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey
		}
	});
}
