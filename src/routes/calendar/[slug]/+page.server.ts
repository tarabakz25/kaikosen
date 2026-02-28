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
		createdBy: 'system',
		createdAt: new Date()
	}
];

const MOCK_ATTENDEES = [
	{ userId: 'mock-a', nickname: '田中雄大', schoolName: '東京高専', avatarUrl: null, pastContests: ['高専プロコン', '高専ロボコン'] },
	{ userId: 'mock-b', nickname: '佐藤美咲', schoolName: '大阪高専', avatarUrl: null, pastContests: ['高専ハッカソン', '競技プログラミング'] },
	{ userId: 'mock-c', nickname: '山田健太', schoolName: '名古屋高専', avatarUrl: null, pastContests: ['高専プロコン', '高専ハッカソン', '競技プログラミング'] },
	{ userId: 'mock-d', nickname: '鈴木あかり', schoolName: '福岡高専', avatarUrl: null, pastContests: ['高専ロボコン', '競技プログラミング'] },
	{ userId: 'mock-e', nickname: '伊藤拓海', schoolName: '仙台高専', avatarUrl: null, pastContests: ['高専プロコン', '高専生交流LT'] },
	{ userId: 'mock-f', nickname: '高橋莉子', schoolName: '神戸高専', avatarUrl: null, pastContests: ['高専ハッカソン', '高専生交流LT'] },
	{ userId: 'mock-g', nickname: '中村大輔', schoolName: '広島高専', avatarUrl: null, pastContests: ['競技プログラミング'] },
	{ userId: 'mock-h', nickname: '小林ゆい', schoolName: '北海道高専', avatarUrl: null, pastContests: ['高専プロコン', '高専ロボコン', '高専ハッカソン'] }
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

	let attendees: { userId: string; nickname: string | null; schoolName: string | null; avatarUrl: string | null; pastContests: string[] }[];
	if (isMock) {
		attendees = MOCK_ATTENDEES;
	} else {
		const rows = await db
			.select({
				userId: eventAttendee.userId,
				nickname: profile.nickname,
				schoolName: profile.schoolName,
				avatarUrl: profile.avatarUrl
			})
			.from(eventAttendee)
			.leftJoin(profile, eq(profile.userId, eventAttendee.userId))
			.where(eq(eventAttendee.eventId, eventId));
		attendees = rows.map((r) => ({ ...r, pastContests: [] as string[] }));
	}

	let isAttending = false;
	let connectionUserIds: string[] = [];
	if (locals.user) {
		if (!isMock) {
			const attendance = await db
				.select()
				.from(eventAttendee)
				.where(and(eq(eventAttendee.eventId, eventId), eq(eventAttendee.userId, locals.user.id)))
				.limit(1);
			isAttending = attendance.length > 0;
		}

		const conns = await db
			.select({ targetUserId: connection.targetUserId })
			.from(connection)
			.where(eq(connection.userId, locals.user.id));
		connectionUserIds = conns.map((c) => c.targetUserId);
	}

	return { event: ev, attendees, isAttending, connectionUserIds, userId: locals.user?.id ?? null };
};
