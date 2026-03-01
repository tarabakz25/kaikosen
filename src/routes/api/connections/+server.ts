import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection, profile } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const userId = locals.user.id;

	// pending=true: alias='' かつ targetUserId=自分 の接続を返す (QRスキャンされた側の検知)
	if (url.searchParams.get('pending') === 'true') {
		const pending = await db
			.select({ id: connection.id, userId: connection.userId, targetUserId: connection.targetUserId })
			.from(connection)
			.where(and(eq(connection.targetUserId, userId), eq(connection.alias, '')))
			.limit(1);
		return Response.json({ pending: pending[0] ?? null });
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
		.where(eq(connection.userId, userId));

	return Response.json(rows);
};

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}
	return Response.json({ error: '繋がりの追加は現在利用できません' }, { status: 403 });
};
