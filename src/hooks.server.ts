import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	let authSetCookies: string[] = [];

	try {
		const sessionUrl = new URL(`${env.NEON_AUTH_URL}/get-session`);

		const verifier = event.url.searchParams.get('neon_auth_session_verifier');
		if (verifier) {
			sessionUrl.searchParams.set('neon_auth_session_verifier', verifier);
		}

		const cookie = event.request.headers.get('cookie') ?? '';
		const response = await fetch(sessionUrl.toString(), {
			headers: { cookie }
		});

		if (response.ok) {
			const data = await response.json();
			if (data?.user) {
				event.locals.user = data.user;
				event.locals.session = data.session;
			}
			authSetCookies = response.headers.getSetCookie?.() ?? [];
		} else {
			const text = await response.text();
			console.log('[hooks] get-session error body:', text.slice(0, 200));
		}
	} catch (e) {
		console.error('[hooks] fetch error:', e);
	}

	const response = await resolve(event);

	for (const cookie of authSetCookies) {
		response.headers.append('set-cookie', cookie);
	}

	return response;
};
