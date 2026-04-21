import type { APIRoute } from 'astro'
import { listDocsTree } from '../../../lib/github'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
	const { path } = params

	try {
		if (!path) {
			const tree = await listDocsTree()
			return new Response(JSON.stringify(tree), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		return new Response(JSON.stringify({ message: 'Not implemented yet' }), {
			status: 501,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error: any) {
		const status = error?.status || 500
		return new Response(JSON.stringify({ error: error.message }), {
			status,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
