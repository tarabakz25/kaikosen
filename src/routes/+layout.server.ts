import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

const PROTECTED_ROUTES = ['/', '/card', '/calendar', '/account', '/profile', '/connect'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user } = locals;

	if (!user) {
		if (PROTECTED_ROUTES.some((r) => url.pathname === r || url.pathname.startsWith(r + '/'))) {
			redirect(302, '/login');
		}
		return { user: null, userProfile: null };
	}

	const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id)).limit(1);

	if (
		!userProfile &&
		url.pathname !== '/account' &&
		url.pathname !== '/account/edit' &&
		url.pathname !== '/login'
	) {
		redirect(302, '/account/edit');
	}

	return { user, userProfile: userProfile ?? null };
};
