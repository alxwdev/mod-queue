import { testPrisma, truncateAll } from '../test/db';
import { createModerator } from '../test/factories';
import { createContext } from './context';

const NOW = new Date('2026-01-10T00:00:00.000Z');

async function actingModerator(headers: Record<string, string>): Promise<string> {
  const context = await createContext({
    request: { headers: new Headers(headers) },
    prisma: testPrisma,
    now: () => NOW,
  });
  return context.moderator.username;
}

// The moderator cache lives in the module for the whole file, so the tests run in this order.
beforeAll(() => truncateAll());

it('fails with a clear error when the default moderator does not exist', async () => {
  await expect(actingModerator({})).rejects.toThrow('pnpm db:seed');
});

describe('with moderators', () => {
  beforeAll(async () => {
    for (const username of ['mod_aurora', 'mod_birch', 'mod_cedar']) {
      await createModerator({ username });
    }
  });

  afterEach(() => jest.restoreAllMocks());

  it('selects the moderator from the cookie', async () => {
    expect(await actingModerator({ cookie: 'theme=dark; mq_moderator=mod_birch; x=1' })).toBe(
      'mod_birch',
    );
  });

  it('selects the moderator from the header, which wins over the cookie', async () => {
    expect(await actingModerator({ 'x-moderator': 'mod_cedar' })).toBe('mod_cedar');
    expect(
      await actingModerator({ 'x-moderator': 'mod_cedar', cookie: 'mq_moderator=mod_birch' }),
    ).toBe('mod_cedar');
  });

  it('falls back to mod_aurora for an unknown or missing name', async () => {
    expect(await actingModerator({ 'x-moderator': 'mod_unknown' })).toBe('mod_aurora');
    expect(await actingModerator({ cookie: 'mq_moderator=' })).toBe('mod_aurora');
    expect(await actingModerator({})).toBe('mod_aurora');
  });

  it('gives the context the clock and the loaders', async () => {
    const context = await createContext({
      request: { headers: new Headers() },
      prisma: testPrisma,
      now: () => NOW,
    });

    expect(context.now()).toBe(NOW);
    expect(await context.loaders.moderators.load(context.moderator.id)).toEqual(context.moderator);
  });

  it('caches the moderator list for 60 seconds', async () => {
    await createModerator({ username: 'mod_dune' });
    expect(await actingModerator({ 'x-moderator': 'mod_dune' })).toBe('mod_aurora');

    const later = Date.now() + 60_001;
    jest.spyOn(Date, 'now').mockReturnValue(later);

    expect(await actingModerator({ 'x-moderator': 'mod_dune' })).toBe('mod_dune');
  });
});
