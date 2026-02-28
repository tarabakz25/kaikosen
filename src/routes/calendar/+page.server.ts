import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event, eventAttendee, connection } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const events = await db.select().from(event).orderBy(event.startAt);

	const attendeeCounts = await db
		.select({ eventId: eventAttendee.eventId, count: sql<number>`count(*)::int` })
		.from(eventAttendee)
		.groupBy(eventAttendee.eventId);

	const countMap = Object.fromEntries(attendeeCounts.map((r) => [r.eventId, r.count]));

	let connectionUserIds: string[] = [];
	if (locals.user) {
		const conns = await db
			.select({ targetUserId: connection.targetUserId })
			.from(connection)
			.where(eq(connection.userId, locals.user.id));
		connectionUserIds = conns.map((c) => c.targetUserId);
	}

	return {
		events: events.map((e) => ({ ...e, attendeeCount: countMap[e.id] ?? 0 })),
		connectionUserIds
	};
};
