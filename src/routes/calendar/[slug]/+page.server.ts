import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event, eventAttendee, profile, connection } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	const eventId = params.slug;

	const [ev] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
	if (!ev) error(404, 'Event not found');

	const attendees = await db
		.select({
			userId: eventAttendee.userId,
			nickname: profile.nickname,
			schoolName: profile.schoolName,
			avatarUrl: profile.avatarUrl
		})
		.from(eventAttendee)
		.leftJoin(profile, eq(profile.userId, eventAttendee.userId))
		.where(eq(eventAttendee.eventId, eventId));

	let isAttending = false;
	let connectionUserIds: string[] = [];
	if (session) {
		const attendance = await db
			.select()
			.from(eventAttendee)
			.where(and(eq(eventAttendee.eventId, eventId), eq(eventAttendee.userId, session.user.id)))
			.limit(1);
		isAttending = attendance.length > 0;

		const conns = await db
			.select({ targetUserId: connection.targetUserId })
			.from(connection)
			.where(eq(connection.userId, session.user.id));
		connectionUserIds = conns.map((c) => c.targetUserId);
	}

	return { event: ev, attendees, isAttending, connectionUserIds, userId: session?.user.id ?? null };
};
