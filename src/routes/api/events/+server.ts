import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const events = await db.select().from(event).orderBy(asc(event.startAt));
	return Response.json(events);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const body = await request.json();
	const { title, description, url, startAt, endAt, location, imageUrl } = body;

	if (!title || typeof title !== 'string' || title.trim() === '') {
		error(400, 'title is required');
	}
	if (!startAt || typeof startAt !== 'string') {
		error(400, 'startAt is required');
	}

	const [created] = await db
		.insert(event)
		.values({
			title: title.trim(),
			description: description?.trim() || null,
			url: url?.trim() || null,
			startAt: new Date(startAt),
			endAt: endAt ? new Date(endAt) : null,
			location: location?.trim() || null,
			imageUrl: imageUrl?.trim() || null,
			createdBy: locals.user.id
		})
		.returning();

	return Response.json(created, { status: 201 });
};
