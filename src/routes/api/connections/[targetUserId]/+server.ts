import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 繋がりを削除する（自分 → targetUserId）
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const targetUserId = params.targetUserId;

	await db
		.delete(connection)
		.where(
			and(
				eq(connection.userId, locals.user.id),
				eq(connection.targetUserId, targetUserId)
			)
		);

	return new Response(null, { status: 204 });
};
