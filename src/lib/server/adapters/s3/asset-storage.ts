import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	type S3Client
} from '@aws-sdk/client-s3';
import type { AssetStoragePort, AssetUpload, StoredAsset } from '$lib/server/ports/storage';
import { mapS3Error } from './errors';

export class S3AssetStorageAdapter implements AssetStoragePort {
	constructor(
		private readonly client: S3Client,
		private readonly bucket: string,
		private readonly prefix = 'images/'
	) {}

	async upload(asset: AssetUpload): Promise<string> {
		const extension =
			asset.name
				.split('.')
				.pop()
				?.replace(/[^a-zA-Z0-9]/g, '')
				.toLowerCase() || 'bin';
		const path = `${crypto.randomUUID()}.${extension}`;
		try {
			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.prefix + path,
					Body: asset.data,
					ContentType: asset.contentType || 'application/octet-stream',
					CacheControl: 'public, max-age=3600',
					IfNoneMatch: '*'
				})
			);
			return path;
		} catch (error) {
			mapS3Error(error, 'Failed to upload asset');
		}
	}

	async read(path: string): Promise<StoredAsset> {
		try {
			const response = await this.client.send(
				new GetObjectCommand({ Bucket: this.bucket, Key: this.prefix + path })
			);
			return {
				path,
				contentType: response.ContentType || 'application/octet-stream',
				data: (await response.Body?.transformToByteArray()) ?? new Uint8Array()
			};
		} catch (error) {
			mapS3Error(error, `Asset not found: ${path}`);
		}
	}

	async delete(path: string): Promise<void> {
		try {
			await this.client.send(
				new DeleteObjectCommand({ Bucket: this.bucket, Key: this.prefix + path })
			);
		} catch (error) {
			mapS3Error(error, `Failed to delete asset: ${path}`);
		}
	}
}
