import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { connection } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 二つ名を登録・更新する。
 * 自分 → targetUserId の接続の alias を更新。
 */
export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const targetUserId = params.targetUserId;
	const body = await request.json();
	const { alias } = body as { alias: string };
	if (typeof alias !== 'string' || !alias.trim()) {
		return Response.json({ error: 'alias is required' }, { status: 400 });
	}

	const [updated] = await db
		.update(connection)
		.set({ alias: alias.trim() })
		.where(
			and(
				eq(connection.userId, locals.user.id),
				eq(connection.targetUserId, targetUserId)
			)
		)
		.returning();

	if (!updated) {
		return Response.json({ error: 'Connection not found' }, { status: 404 });
	}

	return Response.json(updated);
};
