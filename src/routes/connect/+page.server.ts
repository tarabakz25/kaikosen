import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	const uid = url.searchParams.get('uid');
	if (!uid) {
		redirect(302, '/');
		return;
	}
	// 自分のQRを開いた場合はプロフィールへ
	if (locals.user && uid === locals.user.id) {
		redirect(302, `/profile/${uid}`);
		return;
	}
	const [targetProfile] = await db
		.select({ nickname: profile.nickname, schoolName: profile.schoolName, avatarUrl: profile.avatarUrl })
		.from(profile)
		.where(eq(profile.userId, uid))
		.limit(1);
	if (!targetProfile) {
		redirect(302, '/');
		return;
	}
	return { targetUserId: uid, targetProfile };
};
