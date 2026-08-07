import {
	HeadObjectCommand,
	PutObjectCommand,
	ListObjectsV2Command,
	S3Client
} from '@aws-sdk/client-s3';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const overwrite = process.argv.includes('--overwrite');
const dryRun = process.argv.includes('--dry-run');
const required = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
if (!dryRun) {
	for (const name of required) {
		if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
	}
}

const client = new S3Client({
	endpoint: process.env.S3_ENDPOINT || 'https://example.invalid',
	region: process.env.S3_REGION || 'auto',
	forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID || 'dry-run',
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'dry-run'
	}
});
const bucket = process.env.S3_BUCKET || 'dry-run';

async function filesBelow(root) {
	const files = [];
	async function visit(directory) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) await visit(fullPath);
			else if (entry.isFile() && entry.name !== '.gitkeep') files.push(fullPath);
		}
	}
	await visit(root);
	return files;
}

async function put(key, body, contentType) {
	const checksum = createHash('sha256').update(body).digest('hex');
	if (dryRun) {
		console.log(`[dry-run] ${key}`);
		return;
	}
	if (!overwrite) {
		try {
			const current = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
			if (current.Metadata?.sha256 === checksum) {
				console.log(`Already migrated ${key}`);
				return;
			}
			throw new Error(`Object already exists with different content: ${key}`);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith('Object already exists')) throw error;
			if (error?.$metadata?.httpStatusCode !== 404) throw error;
		}
	}
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
			Metadata: { sha256: checksum },
			...(overwrite ? {} : { IfNoneMatch: '*' })
		})
	);
	console.log(`Uploaded ${key}`);
}

const expected = new Set();
const docsRoot = path.resolve('src/lib/docs');
for (const file of await filesBelow(docsRoot)) {
	if (!file.endsWith('.md')) continue;
	const relativePath = path.relative(docsRoot, file).split(path.sep).join('/');
	const key = `docs/${relativePath}`;
	let content = await readFile(file, 'utf8');
	content = content.replace(
		/https:\/\/raw\.githubusercontent\.com\/[^\s)]+\/\.github\/images\/([a-zA-Z0-9._-]+)/g,
		'/api/images/$1'
	);
	await put(key, content, 'text/markdown; charset=utf-8');
	expected.add(key);
}

const imagesRoot = path.resolve('.github/images');
const imageNames = new Set();
for (const file of await filesBelow(imagesRoot)) {
	const filename = path.basename(file);
	const extension = path.extname(filename).toLowerCase();
	const contentType = {
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.gif': 'image/gif',
		'.webp': 'image/webp',
		'.avif': 'image/avif'
	}[extension];
	if (!contentType || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(filename)) {
		throw new Error(`Unsupported image filename or type: ${file}`);
	}
	if (imageNames.has(filename)) throw new Error(`Duplicate image filename: ${filename}`);
	imageNames.add(filename);
	const key = `images/${filename}`;
	await put(key, await readFile(file), contentType);
	expected.add(key);
}

if (!dryRun) {
	const uploaded = new Set();
	let continuationToken;
	do {
		const response = await client.send(
			new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
		);
		for (const object of response.Contents || []) if (object.Key) uploaded.add(object.Key);
		continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
	} while (continuationToken);
	const missing = [...expected].filter((key) => !uploaded.has(key));
	if (missing.length)
		throw new Error(`Migration verification failed. Missing: ${missing.join(', ')}`);
}

console.log(`${dryRun ? 'Planned' : 'Verified'} ${expected.size} objects.`);
