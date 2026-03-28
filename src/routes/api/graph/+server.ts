import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile, connection, eventAttendee } from '$lib/server/db/schema';
import { eq, inArray, and, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return Response.json({ nodes: [], edges: [] });

	const userId = locals.user.id;

	const connections = await db.select().from(connection).where(eq(connection.userId, userId));
	const connectedUserIds = connections.map((c) => c.targetUserId);

	const allUserIds = [userId, ...connectedUserIds];
	const profiles = await db.select().from(profile).where(inArray(profile.userId, allUserIds));

	const nodes = profiles.map((p) => ({
		id: p.userId,
		nickname: p.nickname,
		schoolName: p.schoolName,
		role: p.role,
		tags: p.tags,
		avatarUrl: p.avatarUrl,
		message: p.message
	}));

	// 共通イベント数を計算
	const myEvents = await db
		.select({ eventId: eventAttendee.eventId })
		.from(eventAttendee)
		.where(eq(eventAttendee.userId, userId));
	const myEventIds = myEvents.map((e) => e.eventId);

	const sharedCounts =
		myEventIds.length > 0 && connectedUserIds.length > 0
			? await db
					.select({ userId: eventAttendee.userId, count: count() })
					.from(eventAttendee)
					.where(
						and(
							inArray(eventAttendee.userId, connectedUserIds),
							inArray(eventAttendee.eventId, myEventIds)
						)
					)
					.groupBy(eventAttendee.userId)
			: [];

	const countMap = Object.fromEntries(sharedCounts.map((r) => [r.userId, Number(r.count)]));

	const edges = connections.map((c) => ({
		source: c.userId,
		target: c.targetUserId,
		alias: c.alias,
		sharedEventCount: countMap[c.targetUserId] ?? 0
	}));

	return Response.json({ nodes, edges, currentUserId: userId });
};
