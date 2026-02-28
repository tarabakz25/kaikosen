import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eventAttendee, profile } from '$lib/server/db/schema';
import { and, eq, inArray, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { id: excludeEventId } = params;
	const userId = locals.user.id;

	// 1. 自分が参加している他のイベントID一覧（今参加したイベントを除く）
	const userOtherEvents = await db
		.select({ eventId: eventAttendee.eventId })
		.from(eventAttendee)
		.where(and(eq(eventAttendee.userId, userId), ne(eventAttendee.eventId, excludeEventId)));

	const otherEventIds = userOtherEvents.map((r) => r.eventId);
	if (otherEventIds.length === 0) {
		return Response.json([]);
	}

	// 2. それらのイベントに参加している人（自分を除く）をプロフィールと結合
	const rows = await db
		.select({
			userId: eventAttendee.userId,
			nickname: profile.nickname,
			avatarUrl: profile.avatarUrl
		})
		.from(eventAttendee)
		.leftJoin(profile, eq(profile.userId, eventAttendee.userId))
		.where(and(inArray(eventAttendee.eventId, otherEventIds), ne(eventAttendee.userId, userId)));

	// 3. userIdで重複排除
	const seen = new Set<string>();
	const unique = rows.filter((r) => {
		if (seen.has(r.userId)) return false;
		seen.add(r.userId);
		return true;
	});

	return Response.json(unique);
};
