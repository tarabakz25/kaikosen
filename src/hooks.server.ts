import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		const response = await fetch(`${env.NEON_AUTH_URL}/get-session`, {
			headers: event.request.headers
		});
		if (response.ok) {
			const data = await response.json();
			if (data?.user) {
				event.locals.user = data.user;
				event.locals.session = data.session;
			}
		}
	} catch {
		// session remains undefined
	}
	return resolve(event);
};
