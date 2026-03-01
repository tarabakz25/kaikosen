import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventAttendee } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	const attendedEvents = await db
		.select({
			id: event.id,
			title: event.title,
			startAt: event.startAt
		})
		.from(eventAttendee)
		.innerJoin(event, eq(event.id, eventAttendee.eventId))
		.where(eq(eventAttendee.userId, locals.user.id))
		.orderBy(desc(event.startAt));

	return { attendedEvents };
};
