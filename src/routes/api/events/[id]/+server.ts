import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	const [ev] = await db.select().from(event).where(eq(event.id, id)).limit(1);

	if (!ev) {
		return new Response('Not Found', { status: 404 });
	}

	return Response.json(ev);
};
