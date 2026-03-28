import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event, eventAttendee, connection, profile } from '$lib/server/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const events = await db.select().from(event).orderBy(event.startAt);

	const attendeeCounts = await db
		.select({ eventId: eventAttendee.eventId, count: sql<number>`count(*)::int` })
		.from(eventAttendee)
		.groupBy(eventAttendee.eventId);

	const countMap = Object.fromEntries(attendeeCounts.map((r) => [r.eventId, r.count]));

	const connectedAttendeesByEvent: Record<
		string,
		Array<{ userId: string; nickname: string; avatarUrl: string | null }>
	> = {};
	if (locals.user) {
		const conns = await db
			.select({ targetUserId: connection.targetUserId })
			.from(connection)
			.where(eq(connection.userId, locals.user.id));
		const connectionUserIds = conns.map((c) => c.targetUserId);

		if (connectionUserIds.length > 0) {
			const connectedAttendees = await db
				.select({
					eventId: eventAttendee.eventId,
					userId: eventAttendee.userId,
					nickname: profile.nickname,
					avatarUrl: profile.avatarUrl
				})
				.from(eventAttendee)
				.innerJoin(profile, eq(profile.userId, eventAttendee.userId))
				.where(inArray(eventAttendee.userId, connectionUserIds));

			for (const row of connectedAttendees) {
				if (!connectedAttendeesByEvent[row.eventId]) {
					connectedAttendeesByEvent[row.eventId] = [];
				}
				connectedAttendeesByEvent[row.eventId].push({
					userId: row.userId,
					nickname: row.nickname,
					avatarUrl: row.avatarUrl
				});
			}
		}
	}

	const mappedEvents = events.map((e) => ({
		...e,
		attendeeCount: countMap[e.id] ?? 0,
		connectedAttendees: connectedAttendeesByEvent[e.id] ?? []
	}));

	return {
		events: mappedEvents,
		userId: locals.user?.id ?? null
	};
};
