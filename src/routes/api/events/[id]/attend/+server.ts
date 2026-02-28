import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eventAttendee } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { id: eventId } = params;
	const userId = locals.user.id;

	const [existing] = await db
		.select()
		.from(eventAttendee)
		.where(and(eq(eventAttendee.eventId, eventId), eq(eventAttendee.userId, userId)))
		.limit(1);

	if (existing) {
		await db
			.delete(eventAttendee)
			.where(and(eq(eventAttendee.eventId, eventId), eq(eventAttendee.userId, userId)));
		return Response.json({ attending: false });
	} else {
		await db.insert(eventAttendee).values({ eventId, userId });
		return Response.json({ attending: true });
	}
};
