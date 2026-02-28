import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eventAttendee, profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { id: eventId } = params;

	const attendees = await db
		.select({
			userId: eventAttendee.userId,
			joinedAt: eventAttendee.joinedAt,
			nickname: profile.nickname,
			schoolName: profile.schoolName,
			tags: profile.tags,
			avatarUrl: profile.avatarUrl
		})
		.from(eventAttendee)
		.leftJoin(profile, eq(profile.userId, eventAttendee.userId))
		.where(eq(eventAttendee.eventId, eventId));

	return Response.json(attendees);
};
