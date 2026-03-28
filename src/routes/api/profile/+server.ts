import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { profile, eventAttendee } from '$lib/server/db/schema';
import { eq, and, or, like } from 'drizzle-orm';
import { PAST_CONTESTS_TITLE } from '$lib/contests';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const { nickname, role, schoolName, tags, pastContests, message, avatarUrl } = body as {
		nickname: string;
		role: 'student' | 'alumni' | 'company';
		schoolName: string;
		tags: string[];
		pastContests: string[];
		message?: string;
		avatarUrl?: string | null;
	};

	const pastContestsList = pastContests ?? [];
	const userId = locals.user.id;

	const [upserted] = await db
		.insert(profile)
		.values({
			userId,
			nickname,
			role: role ?? 'student',
			schoolName,
			tags,
			pastContests: pastContestsList,
			message: message ?? null,
			avatarUrl: avatarUrl ?? null
		})
		.onConflictDoUpdate({
			target: profile.userId,
			set: {
				nickname,
				role: role ?? 'student',
				schoolName,
				tags,
				pastContests: pastContestsList,
				message: message ?? null,
				avatarUrl: avatarUrl ?? null,
				updatedAt: new Date()
			}
		})
		.returning();

	// event_attendee に {id}-{year} 形式でコンテスト参加を登録
	const contestIds = PAST_CONTESTS_TITLE.map((c) => c.id);
	await db
		.delete(eventAttendee)
		.where(
			and(
				eq(eventAttendee.userId, userId),
				or(...contestIds.map((id) => like(eventAttendee.eventId, `${id}-%`)))
			)
		);

	for (const entry of pastContestsList) {
		// {id}-{year} 形式のみ登録（コンテストIDと年で構成）
		if (/^[a-z]+-\d{4}$/.test(entry)) {
			await db
				.insert(eventAttendee)
				.values({ eventId: entry, userId })
				.onConflictDoNothing({ target: [eventAttendee.eventId, eventAttendee.userId] });
		}
	}

	return Response.json(upserted);
};
