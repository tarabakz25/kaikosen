import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		env.PUBLIC_SUPABASE_URL,
		env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) =>
						event.cookies.set(name, value, { ...options, path: '/' })
					);
				}
			}
		}
	);

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	if (user) {
		event.locals.user = {
			id: user.id,
			name: user.user_metadata?.full_name ?? user.email ?? '',
			email: user.email ?? '',
			image: user.user_metadata?.avatar_url ?? null,
			message: (user.user_metadata?.message as string) ?? null
		};
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
