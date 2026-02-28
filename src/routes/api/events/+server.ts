import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const events = await db.select().from(event).orderBy(asc(event.startAt));
	return Response.json(events);
};
