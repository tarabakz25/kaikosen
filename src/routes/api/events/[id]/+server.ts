import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	const [ev] = await db.select().from(event).where(eq(event.id, id)).limit(1);

	if (!ev) {
		return new Response('Not Found', { status: 404 });
	}

	return Response.json(ev);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const { id } = params;
	const [ev] = await db.select().from(event).where(eq(event.id, id)).limit(1);
	if (!ev) error(404, 'Event not found');
	if (ev.createdBy !== locals.user.id) error(403, 'Forbidden');

	const body = await request.json();
	const { title, description, url, startAt, endAt, location, imageUrl } = body;

	if (!title || typeof title !== 'string' || title.trim() === '') {
		error(400, 'title is required');
	}
	if (!startAt || typeof startAt !== 'string') {
		error(400, 'startAt is required');
	}

	const [updated] = await db
		.update(event)
		.set({
			title: title.trim(),
			description: description?.trim() || null,
			url: url?.trim() || null,
			startAt: new Date(startAt),
			endAt: endAt ? new Date(endAt) : null,
			location: location?.trim() || null,
			imageUrl: imageUrl?.trim() || null
		})
		.where(eq(event.id, id))
		.returning();

	return Response.json(updated);
};
