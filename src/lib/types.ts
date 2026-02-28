export type Profile = {
  id: string; userId: string; nickname: string; schoolName: string;
  tags: string[]; avatarUrl: string | null; createdAt: Date; updatedAt: Date;
};
export type Connection = {
  id: string; userId: string; targetUserId: string; alias: string; connectedAt: Date;
};
export type Event = {
  id: string; title: string; description: string | null; url: string | null;
  startAt: Date; endAt: Date | null; location: string | null; createdBy: string; createdAt: Date;
};
export type EventAttendee = { eventId: string; userId: string; joinedAt: Date; };
export type GraphNode = { id: string; nickname: string; schoolName: string; tags: string[]; avatarUrl: string | null; };
export type GraphEdge = { source: string; target: string; };
