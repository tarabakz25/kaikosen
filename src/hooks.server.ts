import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

function splitSetCookieHeader(header: string): string[] {
	// Split on cookie boundaries while preserving commas inside Expires attributes.
	return header
		.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g)
		.map((value) => value.trim())
		.filter(Boolean);
}

function extractSetCookies(headers: Headers): string[] {
	const value = headers as Headers & { getSetCookie?: () => string[] };
	if (typeof value.getSetCookie === 'function') {
		const cookies = value.getSetCookie();
		if (cookies.length > 0) return cookies;
	}

	const fallback = headers.get('set-cookie');
	if (!fallback) return [];
	return splitSetCookieHeader(fallback);
}

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
			headers: {
				cookie,
				origin: event.url.origin,
				'x-forwarded-host': event.url.host,
				'x-forwarded-proto': event.url.protocol.replace(':', '')
			}
		});

		if (response.ok) {
			const data = await response.json();
			if (data?.user) {
				event.locals.user = data.user;
				event.locals.session = data.session;
			}
			authSetCookies = extractSetCookies(response.headers);

			if (verifier && authSetCookies.length === 0) {
				console.warn('[hooks] verifier exists but no set-cookie returned from Neon Auth');
			}
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
