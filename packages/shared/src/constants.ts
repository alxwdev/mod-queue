// The value arrays mirror the Prisma and GraphQL enums of the same names.

export const REPORT_REASONS = [
  'SPAM',
  'OFF_TOPIC',
  'SELF_PROMOTION',
  'LOW_EFFORT',
  'MISLEADING',
  'RULE_BREAK',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const CONTENT_TYPES = ['POST', 'COMMENT'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const MOD_ACTION_TYPES = ['APPROVE', 'REMOVE', 'BAN'] as const;
export type ModActionType = (typeof MOD_ACTION_TYPES)[number];

export const QUEUE_SORTS = ['OLDEST', 'NEWEST', 'MOST_REPORTED'] as const;
export type QueueSort = (typeof QUEUE_SORTS)[number];

export const QUEUE_AGES = ['LAST_HOUR', 'LAST_24_HOURS', 'OLDER_THAN_24_HOURS'] as const;
export type QueueAge = (typeof QUEUE_AGES)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  OFF_TOPIC: 'Off-topic',
  SELF_PROMOTION: 'Self-promotion',
  LOW_EFFORT: 'Low effort',
  MISLEADING: 'Misleading',
  RULE_BREAK: 'Rule break',
  OTHER: 'Other',
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  POST: 'Post',
  COMMENT: 'Comment',
};

// Past tense: the labels name actions that already happened (mod log rows and filters).
export const MOD_ACTION_TYPE_LABELS: Record<ModActionType, string> = {
  APPROVE: 'Approved',
  REMOVE: 'Removed',
  BAN: 'Banned',
};

export const QUEUE_SORT_LABELS: Record<QueueSort, string> = {
  OLDEST: 'Oldest first',
  NEWEST: 'Newest first',
  MOST_REPORTED: 'Most reported',
};

export const QUEUE_AGE_LABELS: Record<QueueAge, string> = {
  LAST_HOUR: 'Last hour',
  LAST_24_HOURS: 'Last 24 hours',
  OLDER_THAN_24_HOURS: 'Older than 24 hours',
};

/** Most item ids that one bulk command may carry. */
export const MAX_BULK_IDS = 200;
/** How long after an action its undo is still allowed: 10 minutes. */
export const UNDO_WINDOW_MS = 600_000;
export const QUEUE_PAGE_SIZE = 50;
/** Timed ban lengths; a permanent ban has no duration (`banDurationDays` is null). */
export const BAN_DURATION_DAYS = [1, 3, 7, 30] as const;
