import { execute } from '../../test/execute';
import { truncateAll } from '../../test/db';
import { createModerator } from '../../test/factories';

const now = () => new Date('2026-01-10T00:00:00.000Z');

beforeEach(() => truncateAll());

describe('Query.me', () => {
  it('returns the acting moderator', async () => {
    const moderator = await createModerator({ username: 'mod_birch', displayName: 'Birch' });

    const result = await execute('{ me { id username displayName } }', {}, { moderator, now });

    expect(result).toEqual({
      data: { me: { id: moderator.id, username: 'mod_birch', displayName: 'Birch' } },
    });
  });
});

describe('Query.moderators', () => {
  it('returns every moderator ordered by username', async () => {
    const moderator = await createModerator({ username: 'mod_cedar' });
    await createModerator({ username: 'mod_aurora' });
    await createModerator({ username: 'mod_birch' });

    const result = await execute('{ moderators { username } }', {}, { moderator, now });

    expect(result).toEqual({
      data: {
        moderators: [
          { username: 'mod_aurora' },
          { username: 'mod_birch' },
          { username: 'mod_cedar' },
        ],
      },
    });
  });
});
