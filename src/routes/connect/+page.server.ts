import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const uid = url.searchParams.get('uid');
	if (uid) {
		redirect(302, `/profile/${uid}`);
	} else {
		redirect(302, '/');
	}
};
