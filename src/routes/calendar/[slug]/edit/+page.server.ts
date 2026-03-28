import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(302, '/login');

	const [ev] = await db.select().from(event).where(eq(event.id, params.slug)).limit(1);
	if (!ev) error(404, 'Event not found');
	if (ev.createdBy !== locals.user.id) error(403, 'このイベントを編集する権限がありません');

	return { event: ev };
};
