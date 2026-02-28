import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile, connection } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const profiles = await db.select().from(profile);
	const connections = await db.select().from(connection);

	const nodes = profiles.map((p) => ({
		id: p.userId,
		nickname: p.nickname,
		schoolName: p.schoolName,
		tags: p.tags,
		avatarUrl: p.avatarUrl
	}));

	// Deduplicate: only include where userId < targetUserId
	const edges = connections
		.filter((c) => c.userId < c.targetUserId)
		.map((c) => ({ source: c.userId, target: c.targetUserId }));

	return Response.json({ nodes, edges });
};
