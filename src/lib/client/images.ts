const MAX_IMAGE_DIMENSION = 1280;
const WEBP_QUALITY = 0.75;
const OPTIMIZABLE_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif']);

function webpFilename(filename: string): string {
	const basename = filename.replace(/\.[^.]+$/, '');
	return `${basename || 'image'}.webp`;
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
}

export async function optimizeImage(file: File): Promise<File> {
	if (!OPTIMIZABLE_IMAGE_TYPES.has(file.type)) return file;

	let image: ImageBitmap | undefined;
	try {
		image = await createImageBitmap(file);
		const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(image.width * scale));
		canvas.height = Math.max(1, Math.round(image.height * scale));
		const context = canvas.getContext('2d');
		if (!context) return file;
		context.drawImage(image, 0, 0, canvas.width, canvas.height);

		const optimized = await canvasBlob(canvas);
		if (!optimized || optimized.size >= file.size) return file;
		return new File([optimized], webpFilename(file.name), {
			type: optimized.type,
			lastModified: file.lastModified
		});
	} catch {
		return file;
	} finally {
		image?.close();
	}
}
