import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * スキャンした相手への繋がりを二つ名付きで登録する。
 * 自分 → targetUserId の接続を作成。
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const body = await request.json();
	const { targetUserId, alias } = body as { targetUserId: string; alias: string };
	if (
		!targetUserId ||
		targetUserId === locals.user.id ||
		typeof alias !== 'string' ||
		!alias.trim()
	) {
		return Response.json({ error: 'Invalid request' }, { status: 400 });
	}

	const userId = locals.user.id;
	const aliasTrimmed = alias.trim();

	// 自分 → 相手 の接続を upsert
	await db
		.insert(connection)
		.values({ userId, targetUserId, alias: aliasTrimmed })
		.onConflictDoUpdate({
			target: [connection.userId, connection.targetUserId],
			set: { alias: aliasTrimmed }
		});

	// 逆方向がなければ alias='' で作成（相手が二つ名を登録する用）
	const [existing] = await db
		.select()
		.from(connection)
		.where(and(eq(connection.userId, targetUserId), eq(connection.targetUserId, userId)))
		.limit(1);
	if (!existing) {
		await db.insert(connection).values({ userId: targetUserId, targetUserId: userId, alias: '' });
	}

	return Response.json({ ok: true });
};
