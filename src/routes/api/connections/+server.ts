import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection, profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const rows = await db
		.select({
			id: connection.id,
			userId: connection.userId,
			targetUserId: connection.targetUserId,
			alias: connection.alias,
			connectedAt: connection.connectedAt,
			targetProfile: {
				nickname: profile.nickname,
				schoolName: profile.schoolName,
				tags: profile.tags,
				avatarUrl: profile.avatarUrl
			}
		})
		.from(connection)
		.leftJoin(profile, eq(profile.userId, connection.targetUserId))
		.where(eq(connection.userId, locals.user.id));

	return Response.json(rows);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const { targetUserId, alias } = body as { targetUserId: string; alias: string };

	const [newConnection] = await db
		.insert(connection)
		.values({
			userId: locals.user.id,
			targetUserId,
			alias
		})
		.returning();

	return Response.json(newConnection, { status: 201 });
};
