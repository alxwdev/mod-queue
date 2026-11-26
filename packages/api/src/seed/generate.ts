import { faker } from '@faker-js/faker/locale/en';
import type {
  Author,
  Community,
  Content,
  ContentStatus,
  ModAction,
  ModActionType,
  Moderator,
  RemovalReason,
  Report,
} from '../generated/prisma/client';
import { ReportReason } from '../generated/prisma/enums';
import { SEED_PRESETS, type SeedPresetName } from './presets';
import {
  COMMUNITIES,
  CONTENT_TEXTS,
  type ContentReason,
  MODERATORS,
  PARENT_POST_TITLES,
  REMOVAL_REASONS,
  REPORT_NOTES,
} from './text-bank';

/** Rows for every table, ready for `createMany`. */
export interface Dataset {
  moderators: Moderator[];
  communities: Community[];
  removalReasons: RemovalReason[];
  authors: Author[];
  contents: Content[];
  reports: Report[];
  modActions: ModAction[];
}

export interface GenerateOptions {
  /** All times are placed relative to this time. IDs and texts do not depend on it. */
  now: Date;
  seed?: number;
}

/** Row counts that the seed CLI prints. */
export interface DatasetSummary {
  visiblePending: number;
  scheduled: number;
  resolved: number;
  reports: number;
  actions: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const POST_SHARE = 0.6;
/** Share of the extra reports (after the first one) that repeat the item's main reason. */
const MAIN_REASON_SHARE = 0.7;
const NOTE_SHARE = 0.25;
const REPEAT_OFFENDER_SHARE = 0.05;
const BANNED_SHARE = 0.02;
/** Share of the other resolved items (not from repeat offenders) that are removed. */
const OTHER_REMOVED_SHARE = 0.25;
const MEDIAN_MINUTES_TO_ACTION = 40;
const TIME_TO_ACTION_SIGMA = 1;
/** Longer than the 14-day action window, so every seeded timed ban is still active. */
const BAN_DAYS = 30;

const MAIN_REASONS: { weight: number; value: ContentReason }[] = [
  { weight: 30, value: 'SPAM' },
  { weight: 20, value: 'OFF_TOPIC' },
  { weight: 15, value: 'SELF_PROMOTION' },
  { weight: 15, value: 'LOW_EFFORT' },
  { weight: 10, value: 'MISLEADING' },
  { weight: 10, value: 'RULE_BREAK' },
];
const REPORT_COUNTS = [45, 25, 12, 7, 5, 3, 2, 1].map((weight, index) => ({
  weight,
  value: index + 1,
}));
const SCHEDULED_REPORT_COUNTS = [60, 30, 10].map((weight, index) => ({ weight, value: index + 1 }));
const ALL_REPORT_REASONS = Object.values(ReportReason);

/**
 * Builds the demo data for a preset. The same seed gives the same rows; `now` moves only the times.
 *
 * Every random value comes from the seeded faker, and the number of values drawn never depends on
 * `now`. So the IDs stay the same after every daily reset, and `?item=<id>` links keep working.
 */
export function generateDataset(
  presetName: SeedPresetName,
  { now, seed = 42 }: GenerateOptions,
): Dataset {
  const preset = SEED_PRESETS[presetName];
  const nowMs = now.getTime();
  // One shared instance: seeding it here makes every call start the same random sequence.
  faker.seed(seed);

  const setupAt = new Date(nowMs - 365 * DAY_MS);
  const moderators = MODERATORS.slice(0, preset.moderators).map(
    ({ username, displayName, role }): Moderator => ({
      id: faker.string.uuid(),
      username,
      displayName,
      role,
      createdAt: setupAt,
    }),
  );
  const communityPool = COMMUNITIES.slice(0, preset.communities).map(({ slug, name, topics }) => ({
    community: { id: faker.string.uuid(), slug, name, createdAt: setupAt } satisfies Community,
    topics,
  }));
  const reasonPool = REMOVAL_REASONS.map(({ title, messageTemplate, reportReason }, index) => ({
    removalReason: {
      id: faker.string.uuid(),
      title,
      messageTemplate,
      sortOrder: index,
      archivedAt: null,
      createdAt: setupAt,
      updatedAt: setupAt,
    } satisfies RemovalReason,
    reportReason,
  }));

  const usernames = new Set<string>();
  const authors = Array.from({ length: preset.authors }, (): Author => {
    const id = faker.string.uuid();
    const username = uniqueName(faker.internet.username(), usernames);
    const ageDays = 30 + faker.number.float() * 970;
    return { id, username, createdAt: toDate(nowMs - ageDays * DAY_MS) };
  });

  const contents: Content[] = [];
  const reports: Report[] = [];
  const modActions: ModAction[] = [];

  /** Adds one content with a report at `firstReportedAt` and one at each later time. */
  function addContent(
    author: Author,
    status: ContentStatus,
    firstReportedAt: number,
    laterReportTimes: number[],
    actionAt?: number,
  ): { content: Content; mainReason: ContentReason } {
    const id = faker.string.uuid();
    const type = faker.number.float() < POST_SHARE ? 'POST' : 'COMMENT';
    const { community, topics } = faker.helpers.arrayElement(communityPool);
    const topic = faker.helpers.arrayElement(topics);
    const mainReason = faker.helpers.weightedArrayElement(MAIN_REASONS);
    const texts = CONTENT_TEXTS[mainReason];
    const heading = fillTopic(
      faker.helpers.arrayElement(type === 'POST' ? texts.titles : PARENT_POST_TITLES),
      topic,
    );
    const body = fillTopic(faker.helpers.arrayElement(texts.bodies), topic);
    const createdAt = firstReportedAt - 5 * MINUTE_MS - faker.number.float() * 2 * DAY_MS;

    const reportTimes = [firstReportedAt, ...laterReportTimes];
    reportTimes.forEach((time, index) => {
      const reason =
        index === 0 || faker.number.float() < MAIN_REASON_SHARE
          ? mainReason
          : faker.helpers.arrayElement(ALL_REPORT_REASONS);
      const note =
        faker.number.float() < NOTE_SHARE ? faker.helpers.arrayElement(REPORT_NOTES[reason]) : null;
      reports.push({
        id: faker.string.uuid(),
        reason,
        note,
        createdAt: toDate(time),
        contentId: id,
      });
    });

    const content: Content = {
      id,
      type,
      title: type === 'POST' ? heading : null,
      body,
      parentTitle: type === 'COMMENT' ? heading : null,
      status,
      reportCount: reportTimes.length,
      firstReportedAt: toDate(firstReportedAt),
      createdAt: toDate(createdAt),
      updatedAt: toDate(actionAt ?? createdAt),
      communityId: community.id,
      authorId: author.id,
    };
    contents.push(content);
    return { content, mainReason };
  }

  function removalReasonFor(mainReason: ContentReason): RemovalReason {
    const match = reasonPool.find(({ reportReason }) => reportReason === mainReason);
    if (!match) throw new Error(`The text bank has no removal reason for ${mainReason} reports.`);
    return match.removalReason;
  }

  // Visible pending items: the queue right after a reset.
  const visibleTime = rhythmSampler(nowMs - 7 * DAY_MS, nowMs);
  for (let index = 0; index < preset.pendingContents; index += 1) {
    const first = visibleTime(faker.number.float());
    const later = laterTimes(faker.helpers.weightedArrayElement(REPORT_COUNTS) - 1, first, nowMs);
    addContent(faker.helpers.arrayElement(authors), 'PENDING', first, later);
  }

  // Resolved items. The repeat offenders (the first 5 % of the shuffled authors) get 2–3
  // removals each, and the first 2 % also get an active ban. Every other author gets at most one
  // removal, so only the repeat offenders have 2+.
  const shuffled = faker.helpers.shuffle(authors);
  const repeatCount = Math.round(preset.authors * REPEAT_OFFENDER_SHARE);
  const outcomes: { author: Author; type: ModActionType }[] = [];
  for (const author of shuffled.slice(0, repeatCount)) {
    const removals = faker.number.int({ min: 2, max: 3 });
    for (let index = 0; index < removals; index += 1) outcomes.push({ author, type: 'REMOVE' });
  }
  for (const author of shuffled.slice(0, Math.round(preset.authors * BANNED_SHARE))) {
    outcomes.push({ author, type: 'BAN' });
  }
  const otherRemovals = Math.round(
    (preset.resolvedContents - outcomes.length) * OTHER_REMOVED_SHARE,
  );
  for (const author of shuffled.slice(repeatCount, repeatCount + otherRemovals)) {
    outcomes.push({ author, type: 'REMOVE' });
  }
  while (outcomes.length < preset.resolvedContents) {
    outcomes.push({ author: faker.helpers.arrayElement(authors), type: 'APPROVE' });
  }

  const actionTime = rhythmSampler(nowMs - 14 * DAY_MS, nowMs);
  for (const { author, type } of outcomes) {
    const actionAt = actionTime(faker.number.float());
    const first = actionAt - minutesToAction() * MINUTE_MS;
    const later = laterTimes(
      faker.helpers.weightedArrayElement(REPORT_COUNTS) - 1,
      first,
      actionAt,
    );
    const status = type === 'APPROVE' ? 'APPROVED' : 'REMOVED';
    const { content, mainReason } = addContent(author, status, first, later, actionAt);
    const reason = type === 'APPROVE' ? null : removalReasonFor(mainReason);
    const timedBan = type === 'BAN' && faker.datatype.boolean();
    modActions.push({
      id: faker.string.uuid(),
      batchId: faker.string.uuid(),
      type,
      createdAt: toDate(actionAt),
      undoneAt: null,
      contentId: content.id,
      authorId: author.id,
      moderatorId: faker.helpers.arrayElement(moderators).id,
      removalReasonId: reason?.id ?? null,
      reasonTitle: reason?.title ?? null,
      messageToUser: null,
      banDurationDays: timedBan ? BAN_DAYS : null,
      banExpiresAt: timedBan ? toDate(actionAt + BAN_DAYS * DAY_MS) : null,
    });
  }

  // Scheduled items (time-released reports): every report has the item's firstReportedAt, so
  // reportCount stays exact while the item is hidden.
  const scheduledTime = rhythmSampler(nowMs + 1_000, nowMs + 30 * HOUR_MS);
  for (let index = 0; index < preset.scheduledContents; index += 1) {
    const first = scheduledTime(faker.number.float());
    const count = faker.helpers.weightedArrayElement(SCHEDULED_REPORT_COUNTS);
    const later = Array<number>(count - 1).fill(first);
    addContent(faker.helpers.arrayElement(authors), 'PENDING', first, later);
  }

  return {
    moderators,
    communities: communityPool.map(({ community }) => community),
    removalReasons: reasonPool.map(({ removalReason }) => removalReason),
    authors,
    contents,
    reports,
    modActions,
  };
}

/** Counts the visible pending, scheduled and resolved items, the reports and the actions. */
export function summarizeDataset(dataset: Dataset, now: Date): DatasetSummary {
  const pending = dataset.contents.filter((content) => content.status === 'PENDING');
  const visiblePending = pending.filter((content) => content.firstReportedAt <= now).length;
  return {
    visiblePending,
    scheduled: pending.length - visiblePending,
    resolved: dataset.contents.length - pending.length,
    reports: dataset.reports.length,
    actions: dataset.modActions.length,
  };
}

function toDate(ms: number): Date {
  return new Date(Math.floor(ms));
}

function fillTopic(template: string, topic: string): string {
  return template.replaceAll('{topic}', topic);
}

// Random usernames collide now and then; a numeric suffix keeps them unique without more draws.
function uniqueName(name: string, taken: Set<string>): string {
  let candidate = name;
  for (let suffix = 2; taken.has(candidate); suffix += 1) candidate = `${name}${suffix}`;
  taken.add(candidate);
  return candidate;
}

/** `count` times spread uniformly over [from, to). */
function laterTimes(count: number, from: number, to: number): number[] {
  return Array.from({ length: count }, () => from + faker.number.float() * (to - from));
}

/** A log-normal time to action: most items are handled within an hour, a few take a day. */
function minutesToAction(): number {
  // Box–Muller turns two uniform values into a standard normal one; 1 - u keeps log() finite.
  const normal =
    Math.sqrt(-2 * Math.log(1 - faker.number.float())) *
    Math.cos(2 * Math.PI * faker.number.float());
  return MEDIAN_MINUTES_TO_ACTION * Math.exp(TIME_TO_ACTION_SIGMA * normal);
}

/** Relative activity per UTC hour: quiet around 05:00, busiest around 17:00. */
function hourWeight(hour: number): number {
  return 1 + 0.6 * Math.cos((2 * Math.PI * (hour - 17)) / 24);
}

/**
 * Returns a function that maps a uniform value in [0, 1) to a time in [start, end) with the daily
 * rhythm of `hourWeight`. It inverts the cumulative weight, so each time costs exactly one random
 * value: rejection sampling would draw a number of values that depends on `now`.
 */
function rhythmSampler(start: number, end: number): (uniform: number) => number {
  const segments: { from: number; to: number; weightFrom: number; weightTo: number }[] = [];
  let total = 0;
  for (let from = start; from < end;) {
    const to = Math.min(end, (Math.floor(from / HOUR_MS) + 1) * HOUR_MS);
    const weightFrom = total;
    total += (to - from) * hourWeight(new Date(from).getUTCHours());
    segments.push({ from, to, weightFrom, weightTo: total });
    from = to;
  }
  return (uniform) => {
    const target = uniform * total;
    const segment = segments.find(({ weightTo }) => weightTo > target);
    if (!segment) throw new RangeError(`Expected a value in [0, 1), got ${uniform}.`);
    const { from, to, weightFrom, weightTo } = segment;
    return from + ((target - weightFrom) / (weightTo - weightFrom)) * (to - from);
  };
}
