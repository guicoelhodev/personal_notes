import { listDocsTree, getFile } from '$lib/github';

export async function GET({ params }) {
	const { path } = params;
	try {
		if (!path) {
			const tree = await listDocsTree();
			return new Response(JSON.stringify(tree), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const content = await getFile(path);
		return new Response(content, {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		});
	} catch (error: any) {
		const status = error?.status || 500;
		return new Response(JSON.stringify({ error: error.message }), {
			status,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
