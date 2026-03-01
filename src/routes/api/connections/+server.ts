import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection, profile } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const userId = locals.user.id;

	// pending=true: 自分が userId で alias='' の接続を返す（誰かが自分のQRをスキャンした→相手に二つ名を登録する）
	if (url.searchParams.get('pending') === 'true') {
		const [pending] = await db
			.select({
				id: connection.id,
				userId: connection.userId,
				targetUserId: connection.targetUserId
			})
			.from(connection)
			.where(and(eq(connection.userId, userId), eq(connection.alias, '')))
			.limit(1);
		if (!pending) return Response.json({ pending: null });
		// 相手のプロフィールを取得して返す
		const [targetProfile] = await db
			.select({
				userId: profile.userId,
				nickname: profile.nickname,
				schoolName: profile.schoolName,
				avatarUrl: profile.avatarUrl
			})
			.from(profile)
			.where(eq(profile.userId, pending.targetUserId))
			.limit(1);
		return Response.json({
			pending: { ...pending, targetProfile: targetProfile ?? null }
		});
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
