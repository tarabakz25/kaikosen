import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const { nickname, schoolName, tags, pastContests } = body as {
		nickname: string;
		schoolName: string;
		tags: string[];
		pastContests: string[];
	};

	const [upserted] = await db
		.insert(profile)
		.values({
			userId: locals.user.id,
			nickname,
			schoolName,
			tags,
			pastContests: pastContests ?? []
		})
		.onConflictDoUpdate({
			target: profile.userId,
			set: {
				nickname,
				schoolName,
				tags,
				pastContests: pastContests ?? [],
				updatedAt: new Date()
			}
		})
		.returning();

	return Response.json(upserted);
};
