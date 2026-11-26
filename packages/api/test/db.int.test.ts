import { testPrisma, truncateAll } from './db';
import { createAction, createContent, createReason } from './factories';

async function countRows(): Promise<Record<string, number>> {
  const [moderator, community, author, content, report, removalReason, modAction] =
    await Promise.all([
      testPrisma.moderator.count(),
      testPrisma.community.count(),
      testPrisma.author.count(),
      testPrisma.content.count(),
      testPrisma.report.count(),
      testPrisma.removalReason.count(),
      testPrisma.modAction.count(),
    ]);
  return { moderator, community, author, content, report, removalReason, modAction };
}

beforeEach(() => truncateAll());

describe('createContent', () => {
  it('inserts one content with two reports', async () => {
    const content = await createContent({
      reports: [{ reason: 'SPAM' }, { reason: 'OFF_TOPIC' }],
    });

    const reports = await testPrisma.report.findMany({ where: { contentId: content.id } });
    expect(await testPrisma.content.count()).toBe(1);
    expect(reports.map((report) => report.reason).sort()).toEqual(['OFF_TOPIC', 'SPAM']);
    expect(content.reportCount).toBe(2);
  });
});

describe('truncateAll', () => {
  it('empties every table', async () => {
    const reason = await createReason();
    await createAction({ type: 'REMOVE', removalReasonId: reason.id });
    const before = await countRows();
    expect(Object.values(before)).not.toContain(0);

    await truncateAll();

    const empty = Object.fromEntries(Object.keys(before).map((table) => [table, 0]));
    expect(await countRows()).toEqual(empty);
  });
});
