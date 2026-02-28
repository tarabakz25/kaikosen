import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		const url = `${env.NEON_AUTH_URL}/get-session`;
		const cookie = event.request.headers.get('cookie') ?? '';
		console.log('[hooks] NEON_AUTH_URL:', env.NEON_AUTH_URL);
		console.log('[hooks] cookie:', cookie.slice(0, 100));
		const response = await fetch(url, {
			headers: { cookie }
		});
		console.log('[hooks] get-session status:', response.status);
		if (response.ok) {
			const data = await response.json();
			console.log('[hooks] data.user:', data?.user?.id ?? null);
			if (data?.user) {
				event.locals.user = data.user;
				event.locals.session = data.session;
			}
		} else {
			const text = await response.text();
			console.log('[hooks] get-session error body:', text.slice(0, 200));
		}
	} catch (e) {
		console.error('[hooks] fetch error:', e);
	}
	return resolve(event);
};
