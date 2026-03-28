import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event, eventAttendee, profile, connection } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

const MOCK_EVENTS = [
	{
		id: 'mock-1',
		title: '高専ハッカソン2026 Spring',
		description: '全国の高専生が集まる48時間ハッカソン。テーマは「未来のインフラ」。',
		url: null,
		startAt: new Date('2026-03-15T09:00:00'),
		endAt: new Date('2026-03-16T21:00:00'),
		location: '東京高専 体育館',
		imageUrl: null,
		createdBy: 'system',
		createdAt: new Date()
	},
	{
		id: 'mock-2',
		title: '高専プロコン2026 地区予選',
		description: 'プログラミングコンテスト地区予選。課題部門・自由部門・競技部門。',
		url: null,
		startAt: new Date('2026-04-20T10:00:00'),
		endAt: new Date('2026-04-20T18:00:00'),
		location: '大阪高専',
		imageUrl: null,
		createdBy: 'system',
		createdAt: new Date()
	},
	{
		id: 'mock-3',
		title: '高専生交流LT会 #3',
		description: '高専生によるライトニングトーク。5分×10本。懇親会あり。',
		url: null,
		startAt: new Date('2026-03-08T18:30:00'),
		endAt: new Date('2026-03-08T21:00:00'),
		location: 'オンライン (Discord)',
		imageUrl: null,
		createdBy: 'system',
		createdAt: new Date()
	},
	{
		id: 'mock-4',
		title: 'ロボコン全国大会 2026',
		description: '高専ロボコン全国大会。今年のテーマは「共創」。',
		url: null,
		startAt: new Date('2026-11-01T09:00:00'),
		endAt: new Date('2026-11-01T18:00:00'),
		location: '国技館（東京）',
		imageUrl: null,
		createdBy: 'system',
		createdAt: new Date()
	}
];

export const load: PageServerLoad = async ({ locals, params }) => {
	const eventId = params.slug;
	const isMock = eventId.startsWith('mock-');

	let ev: (typeof MOCK_EVENTS)[0] | typeof event.$inferSelect;
	if (isMock) {
		const found = MOCK_EVENTS.find((e) => e.id === eventId);
		if (!found) error(404, 'Event not found');
		ev = found;
	} else {
		const [dbEv] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
		if (!dbEv) error(404, 'Event not found');
		ev = dbEv;
	}

	const attendees = await db
		.select({
			userId: eventAttendee.userId,
			nickname: profile.nickname,
			schoolName: profile.schoolName,
			role: profile.role,
			avatarUrl: profile.avatarUrl,
			pastContests: profile.pastContests
		})
		.from(eventAttendee)
		.leftJoin(profile, eq(profile.userId, eventAttendee.userId))
		.where(eq(eventAttendee.eventId, eventId));

	let isAttending = false;
	let connectionUserIds: string[] = [];
	if (locals.user) {
		const attendance = await db
			.select()
			.from(eventAttendee)
			.where(and(eq(eventAttendee.eventId, eventId), eq(eventAttendee.userId, locals.user.id)))
			.limit(1);
		isAttending = attendance.length > 0;

		const conns = await db
			.select({ targetUserId: connection.targetUserId })
			.from(connection)
			.where(eq(connection.userId, locals.user.id));
		connectionUserIds = conns.map((c) => c.targetUserId);
	}

	const isOrganizer = locals.user?.id === ev.createdBy;

	let organizerProfile: { nickname: string; avatarUrl: string | null } | null = null;
	if (ev.createdBy !== 'system') {
		const [orgProfile] = await db
			.select({ nickname: profile.nickname, avatarUrl: profile.avatarUrl })
			.from(profile)
			.where(eq(profile.userId, ev.createdBy))
			.limit(1);
		organizerProfile = orgProfile ?? null;
	}

	return {
		event: ev,
		attendees,
		isAttending,
		connectionUserIds,
		userId: locals.user?.id ?? null,
		isOrganizer,
		organizerProfile
	};
};
