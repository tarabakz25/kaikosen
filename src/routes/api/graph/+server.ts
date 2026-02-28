import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile, connection } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

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
		tags: p.tags,
		avatarUrl: p.avatarUrl
	}));

	const edges = connections.map((c) => ({ source: c.userId, target: c.targetUserId }));

	return Response.json({ nodes, edges });
};
