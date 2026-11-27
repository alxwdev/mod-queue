import { removalReasonSchema } from './removal-reason';

const VALID = { title: 'Spam', messageTemplate: 'Hi {{username}}, your post was removed.' };

function issuePaths(value: unknown) {
  return removalReasonSchema.safeParse(value).error?.issues.map((issue) => issue.path);
}

describe('removalReasonSchema', () => {
  it('accepts a valid reason and trims both fields', () => {
    expect(
      removalReasonSchema.parse({
        title: '  Spam  ',
        messageTemplate: `  ${VALID.messageTemplate} `,
      }),
    ).toEqual(VALID);
  });

  it.each([
    ['a title of 2 characters', { ...VALID, title: 'ab' }, 'title'],
    ['a title of 61 characters', { ...VALID, title: 'a'.repeat(61) }, 'title'],
    ['a blank title', { ...VALID, title: '     ' }, 'title'],
    ['a template of 9 characters', { ...VALID, messageTemplate: 'a'.repeat(9) }, 'messageTemplate'],
    [
      'a template of 1001 characters',
      { ...VALID, messageTemplate: 'a'.repeat(1001) },
      'messageTemplate',
    ],
    [
      'an unknown placeholder',
      { ...VALID, messageTemplate: 'Hi {{user}}, your post was removed.' },
      'messageTemplate',
    ],
  ])('rejects %s', (_name, value, field) => {
    expect(issuePaths(value)).toEqual([[field]]);
  });

  it.each([
    ['a title of 3 characters', { ...VALID, title: 'abc' }],
    ['a title of 60 characters', { ...VALID, title: 'a'.repeat(60) }],
    ['a template of 10 characters', { ...VALID, messageTemplate: 'a'.repeat(10) }],
    ['a template of 1000 characters', { ...VALID, messageTemplate: 'a'.repeat(1000) }],
    [
      'every known placeholder',
      { ...VALID, messageTemplate: '{{username}} {{community}} {{reason}} {{duration}}' },
    ],
  ])('accepts %s', (_name, value) => {
    expect(removalReasonSchema.safeParse(value).success).toBe(true);
  });

  it('names each unknown placeholder once in the message', () => {
    const result = removalReasonSchema.safeParse({
      ...VALID,
      messageTemplate: '{{user}} and {{ username }} and {{user}}',
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Remove the unknown placeholders {{user}}, {{ username }}. You can use {{username}}, {{community}}, {{reason}}, {{duration}}.',
    ]);
  });
});
