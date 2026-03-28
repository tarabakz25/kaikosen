import { pgTable, text, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profile = pgTable('profile', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().unique(),
	nickname: text('nickname').notNull(),
	schoolName: text('school_name').notNull(),
	tags: text('tags')
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	pastContests: text('past_contests')
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	message: text('message'),
	avatarUrl: text('avatar_url'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const connection = pgTable(
	'connection',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id').notNull(),
		targetUserId: text('target_user_id').notNull(),
		alias: text('alias').notNull(),
		connectedAt: timestamp('connected_at').notNull().defaultNow()
	},
	(t) => [uniqueIndex('connection_user_target_unique').on(t.userId, t.targetUserId)]
);

export const event = pgTable('event', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	description: text('description'),
	url: text('url'),
	startAt: timestamp('start_at').notNull(),
	endAt: timestamp('end_at'),
	location: text('location'),
	createdBy: text('created_by').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const eventAttendee = pgTable(
	'event_attendee',
	{
		eventId: text('event_id').notNull(),
		userId: text('user_id').notNull(),
		joinedAt: timestamp('joined_at').notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.eventId, t.userId] })]
);
