import type { APIRoute } from 'astro'
import { updateFile } from '../../lib/github'

export const prerender = false

export const PUT: APIRoute = async ({ request }) => {
	try {
		const { path, content } = await request.json()

		if (!path || content === undefined) {
			return new Response(JSON.stringify({ error: 'path and content are required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		await updateFile(path, content)

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error: any) {
		const status = error?.status || 500
		return new Response(JSON.stringify({ error: error.message || 'Failed to save file' }), {
			status,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
