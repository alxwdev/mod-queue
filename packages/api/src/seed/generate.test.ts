import { type Dataset, generateDataset, summarizeDataset } from './generate';
import { SEED_PRESETS } from './presets';

const NOW = new Date('2026-06-15T12:34:56.789Z');
const HOUR_MS = 3_600_000;
// Real platform names that the synthetic data must never contain.
const DENYLIST =
  /\b(reddit|subreddit|facebook|twitter|instagram|tiktok|youtube|discord|twitch|snapchat|linkedin|pinterest|tumblr|whatsapp|telegram|mastodon|bluesky|quora|imgur)\b/gi;

const datasets = {
  full: generateDataset('full', { now: NOW }),
  e2e: generateDataset('e2e', { now: NOW }),
};
const { full } = datasets;

function reportTimesByContent(dataset: Dataset): Map<string, number[]> {
  const times = new Map<string, number[]>();
  for (const report of dataset.reports) {
    times.set(report.contentId, [
      ...(times.get(report.contentId) ?? []),
      report.createdAt.getTime(),
    ]);
  }
  return times;
}

describe('generateDataset', () => {
  it('gives the same output for the same seed', () => {
    expect(generateDataset('e2e', { now: NOW })).toEqual(datasets.e2e);
    expect(generateDataset('e2e', { now: NOW, seed: 7 })).not.toEqual(datasets.e2e);
  });

  it('keeps the IDs when only now changes', () => {
    const ids = (dataset: Dataset) =>
      Object.values(dataset).flatMap((rows: { id: string }[]) => rows.map(({ id }) => id));
    const later = generateDataset('full', { now: new Date(NOW.getTime() + 31 * HOUR_MS) });

    expect(ids(later)).toEqual(ids(full));
  });

  it.each(['full', 'e2e'] as const)('matches the counts of the %s preset', (name) => {
    const preset = SEED_PRESETS[name];
    const dataset = datasets[name];

    expect({
      moderators: dataset.moderators.length,
      communities: dataset.communities.length,
      authors: dataset.authors.length,
      removalReasons: dataset.removalReasons.length,
    }).toEqual({
      moderators: preset.moderators,
      communities: preset.communities,
      authors: preset.authors,
      removalReasons: 8,
    });
    expect(summarizeDataset(dataset, NOW)).toEqual({
      visiblePending: preset.pendingContents,
      scheduled: preset.scheduledContents,
      resolved: preset.resolvedContents,
      reports: dataset.reports.length,
      actions: preset.resolvedContents,
    });
  });

  it('gives every content 1–8 reports that match its reportCount and firstReportedAt', () => {
    const times = reportTimesByContent(full);
    const broken = full.contents.filter((content) => {
      const contentTimes = times.get(content.id) ?? [];
      return (
        contentTimes.length < 1 ||
        contentTimes.length > 8 ||
        content.reportCount !== contentTimes.length ||
        content.firstReportedAt.getTime() !== Math.min(...contentTimes)
      );
    });

    expect(broken).toEqual([]);
  });

  it('puts no report of a visible item after now', () => {
    const visibleIds = new Set(
      full.contents.filter((content) => content.firstReportedAt <= NOW).map(({ id }) => id),
    );
    const lateReports = full.reports.filter(
      (report) => visibleIds.has(report.contentId) && report.createdAt > NOW,
    );

    expect(lateReports).toEqual([]);
  });

  it('schedules items within 30 hours after now, with every report at firstReportedAt', () => {
    const scheduled = full.contents.filter((content) => content.firstReportedAt > NOW);
    const firstById = new Map(scheduled.map((content) => [content.id, content.firstReportedAt]));
    const latest = NOW.getTime() + 30 * HOUR_MS;

    expect(scheduled).toHaveLength(SEED_PRESETS.full.scheduledContents);
    expect(
      scheduled.filter(
        (content) => content.status !== 'PENDING' || content.firstReportedAt.getTime() > latest,
      ),
    ).toEqual([]);
    expect(
      full.reports.filter(
        (report) =>
          firstById.has(report.contentId) &&
          report.createdAt.getTime() !== firstById.get(report.contentId)?.getTime(),
      ),
    ).toEqual([]);
  });

  it('gives 5 % of the authors 2+ removals and 2 % an active ban', () => {
    const removals = new Map<string, number>();
    for (const action of full.modActions.filter(({ type }) => type === 'REMOVE')) {
      removals.set(action.authorId, (removals.get(action.authorId) ?? 0) + 1);
    }
    const bannedAuthors = new Set(
      full.modActions
        .filter((action) => action.type === 'BAN')
        .filter((action) => action.banExpiresAt === null || action.banExpiresAt > NOW)
        .map(({ authorId }) => authorId),
    );

    expect([...removals.values()].filter((count) => count >= 2)).toHaveLength(
      SEED_PRESETS.full.authors * 0.05,
    );
    expect(bannedAuthors.size).toBe(SEED_PRESETS.full.authors * 0.02);
  });

  it('contains no real platform names', () => {
    for (const dataset of Object.values(datasets)) {
      expect(JSON.stringify(dataset).match(DENYLIST)).toBeNull();
    }
  });
});
