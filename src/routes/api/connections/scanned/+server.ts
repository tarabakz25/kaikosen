import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 相手のQRをスキャンしたときに呼ぶ。
 * スキャンされた側（targetUserId）→ スキャンした側（自分）の接続を alias='' で作成し、
 * 相手の画面で二つ名登録の通知が出るようにする。
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const body = await request.json();
	const { scannedUserId } = body as { scannedUserId: string };
	if (!scannedUserId || scannedUserId === locals.user.id) {
		return Response.json({ error: 'Invalid scannedUserId' }, { status: 400 });
	}

	// スキャンされた人 → スキャンした人 の接続を alias='' で作成（相手が二つ名を登録するまで）
	const [existing] = await db
		.select()
		.from(connection)
		.where(
			and(
				eq(connection.userId, scannedUserId),
				eq(connection.targetUserId, locals.user.id)
			)
		)
		.limit(1);

	if (existing) {
		// 既に存在する場合は何もしない（二つ名が既に設定されている可能性あり）
		return Response.json({ ok: true });
	}

	await db.insert(connection).values({
		userId: scannedUserId,
		targetUserId: locals.user.id,
		alias: ''
	});

	return Response.json({ ok: true });
};
