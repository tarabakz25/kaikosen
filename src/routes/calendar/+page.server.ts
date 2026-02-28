import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event, eventAttendee, connection } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

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
		createdAt: new Date(),
		attendeeCount: 42
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
		createdAt: new Date(),
		attendeeCount: 28
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
		createdAt: new Date(),
		attendeeCount: 17
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
		createdAt: new Date(),
		attendeeCount: 156
	}
];

export const load: PageServerLoad = async ({ locals }) => {
	const events = await db.select().from(event).orderBy(event.startAt);

	const attendeeCounts = await db
		.select({ eventId: eventAttendee.eventId, count: sql<number>`count(*)::int` })
		.from(eventAttendee)
		.groupBy(eventAttendee.eventId);

	const countMap = Object.fromEntries(attendeeCounts.map((r) => [r.eventId, r.count]));

	let connectionUserIds: string[] = [];
	if (locals.user) {
		const conns = await db
			.select({ targetUserId: connection.targetUserId })
			.from(connection)
			.where(eq(connection.userId, locals.user.id));
		connectionUserIds = conns.map((c) => c.targetUserId);
	}

	const mappedEvents = events.map((e) => ({ ...e, attendeeCount: countMap[e.id] ?? 0 }));

	return {
		events: mappedEvents.length > 0 ? mappedEvents : MOCK_EVENTS,
		connectionUserIds
	};
};
