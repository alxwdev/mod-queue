/**
 * Row counts of a seed preset. Every preset also gets the 8 removal reasons of the text bank, and
 * every visible or resolved item gets 1–8 reports.
 */
export interface SeedPreset {
  /** The first moderators of the text bank; the first one is the admin `mod_aurora`. */
  moderators: number;
  communities: number;
  authors: number;
  /** Pending items whose first report is in the last 7 days: the queue right after a reset. */
  pendingContents: number;
  /** Approved or removed items, each with one mod action in the last 14 days. */
  resolvedContents: number;
  /** Pending items whose first report is in the next 30 hours (time-released reports). */
  scheduledContents: number;
}

export const SEED_PRESETS = {
  full: {
    moderators: 5,
    communities: 12,
    authors: 2_000,
    pendingContents: 10_500,
    resolvedContents: 2_000,
    scheduledContents: 2_000,
  },
  // No scheduled items, so the counts in E2E tests do not change while the tests run.
  e2e: {
    moderators: 3,
    communities: 12,
    authors: 80,
    pendingContents: 500,
    resolvedContents: 100,
    scheduledContents: 0,
  },
} as const satisfies Record<string, SeedPreset>;

export type SeedPresetName = keyof typeof SEED_PRESETS;

/** Tells whether `name` is the name of a seed preset. */
export function isSeedPresetName(name: string): name is SeedPresetName {
  return Object.hasOwn(SEED_PRESETS, name);
}
