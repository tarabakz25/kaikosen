import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profile, event, eventAttendee, connection } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = params.userId;

	const [userProfile] = await db
		.select()
		.from(profile)
		.where(eq(profile.userId, userId))
		.limit(1);

	if (!userProfile) error(404, 'プロフィールが見つかりません');

	const attendedEvents = await db
		.select({
			id: event.id,
			title: event.title,
			startAt: event.startAt
		})
		.from(eventAttendee)
		.innerJoin(event, eq(event.id, eventAttendee.eventId))
		.where(eq(eventAttendee.userId, userId))
		.orderBy(desc(event.startAt));

	let sharedEventIds = new Set<string>();
	let sharedPastContestEntries = new Set<string>();
	if (locals.user && locals.user.id !== userId) {
		const myAttendances = await db
			.select({ eventId: eventAttendee.eventId })
			.from(eventAttendee)
			.where(eq(eventAttendee.userId, locals.user.id));
		sharedEventIds = new Set(
			attendedEvents.filter((e) => myAttendances.some((a) => a.eventId === e.id)).map((e) => e.id)
		);

		const [myProfile] = await db
			.select({ pastContests: profile.pastContests })
			.from(profile)
			.where(eq(profile.userId, locals.user.id))
			.limit(1);
		const myPastContests = new Set(myProfile?.pastContests ?? []);
		sharedPastContestEntries = new Set(
			(userProfile.pastContests ?? []).filter((entry) => myPastContests.has(entry))
		);
	}

	let isConnected = false;
	if (locals.user && locals.user.id !== userId) {
		const [conn] = await db
			.select()
			.from(connection)
			.where(and(eq(connection.userId, locals.user.id), eq(connection.targetUserId, userId)))
			.limit(1);
		isConnected = !!conn;
	}

	const isSelf = locals.user?.id === userId;

	return {
		profile: userProfile,
		attendedEvents,
		isConnected,
		isSelf,
		sharedEventIds: [...sharedEventIds],
		sharedPastContestEntries: [...sharedPastContestEntries]
	};
};
