import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection, profile } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

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

	const userId = locals.user.id;

	const [newConnection] = await db
		.insert(connection)
		.values({ userId, targetUserId, alias })
		.returning();

	// B→A の逆方向が存在しなければ自動作成
	const existing = await db
		.select()
		.from(connection)
		.where(and(eq(connection.userId, targetUserId), eq(connection.targetUserId, userId)))
		.limit(1);
	if (existing.length === 0) {
		await db.insert(connection).values({ userId: targetUserId, targetUserId: userId, alias: '' });
	}

	return Response.json(newConnection, { status: 201 });
};
