import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const [userProfile] = await db
		.select()
		.from(profile)
		.where(eq(profile.userId, session.user.id))
		.limit(1);

	if (!userProfile) {
		return new Response('Not Found', { status: 404 });
	}

	return Response.json(userProfile);
};
