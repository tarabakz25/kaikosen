import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { userId } = params;

	const [userProfile] = await db
		.select()
		.from(profile)
		.where(eq(profile.userId, userId))
		.limit(1);

	if (!userProfile) {
		return new Response('Not Found', { status: 404 });
	}

	return Response.json(userProfile);
};
