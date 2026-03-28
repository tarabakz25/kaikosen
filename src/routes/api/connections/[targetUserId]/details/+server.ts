import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection, event, eventAttendee } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const userId = locals.user.id;
	const targetUserId = params.targetUserId;

	const [conn] = await db
		.select({ connectedAt: connection.connectedAt, alias: connection.alias })
		.from(connection)
		.where(and(eq(connection.userId, userId), eq(connection.targetUserId, targetUserId)))
		.limit(1);

	if (!conn) return Response.json({ connectedAt: null, alias: null, sharedEvents: [] });

	// 両者が参加したイベントを取得
	const myAttendances = await db
		.select({ eventId: eventAttendee.eventId })
		.from(eventAttendee)
		.where(eq(eventAttendee.userId, userId));
	const myEventIds = myAttendances.map((a) => a.eventId);

	const targetAttendances = await db
		.select({ eventId: eventAttendee.eventId })
		.from(eventAttendee)
		.where(eq(eventAttendee.userId, targetUserId));
	const targetEventIds = new Set(targetAttendances.map((a) => a.eventId));

	const sharedEventIds = myEventIds.filter((id) => targetEventIds.has(id));
	if (sharedEventIds.length === 0) {
		return Response.json({
			connectedAt: conn.connectedAt,
			alias: conn.alias || null,
			sharedEvents: []
		});
	}

	const sharedEvents = await db
		.select({
			id: event.id,
			title: event.title,
			startAt: event.startAt,
			endAt: event.endAt,
			location: event.location
		})
		.from(event)
		.where(inArray(event.id, sharedEventIds))
		.orderBy(asc(event.startAt));

	return Response.json({
		connectedAt: conn.connectedAt,
		alias: conn.alias || null,
		sharedEvents
	});
};
