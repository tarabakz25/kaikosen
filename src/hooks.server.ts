import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.user = {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image
		};
		event.locals.session = {
			id: session.session.id,
			userId: session.session.userId,
			expiresAt: session.session.expiresAt.toISOString()
		};
	}

	return resolve(event);
};
