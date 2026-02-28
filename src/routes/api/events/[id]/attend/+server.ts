import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eventAttendee } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { id: eventId } = params;
	const userId = session.user.id;

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
