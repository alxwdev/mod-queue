import { findUnknownPlaceholders, formatBanDuration, renderTemplate } from './template';

describe('renderTemplate', () => {
  it('fills all placeholders', () => {
    const template =
      'Hi {{username}}, {{community}} removed your post ({{reason}}) for {{duration}}.';

    // Inline call: ESLint's Testing Library rules take a `render…` result in a variable for a render.
    expect(
      renderTemplate(template, {
        username: 'ann',
        community: 'Home Gardening',
        reason: 'Spam',
        duration: '7 days',
      }),
    ).toBe('Hi ann, Home Gardening removed your post (Spam) for 7 days.');
  });

  it('fills every occurrence of a placeholder', () => {
    expect(renderTemplate('{{username}} and {{username}}', { username: 'ann' })).toBe(
      'ann and ann',
    );
  });

  it('keeps unknown placeholders as they are', () => {
    expect(renderTemplate('Hi {{user}} {{ username }}', { username: 'ann' })).toBe(
      'Hi {{user}} {{ username }}',
    );
  });

  it('keeps a name of an Object property as it is', () => {
    expect(renderTemplate('{{constructor}} {{toString}}', {})).toBe('{{constructor}} {{toString}}');
  });

  it('keeps a known placeholder without a value as it is', () => {
    expect(renderTemplate('Banned for {{duration}}.', { username: 'ann' })).toBe(
      'Banned for {{duration}}.',
    );
  });

  it('does not fill placeholders inside a filled value', () => {
    expect(renderTemplate('{{username}}', { username: '{{reason}}', reason: 'Spam' })).toBe(
      '{{reason}}',
    );
  });
});

describe('findUnknownPlaceholders', () => {
  it('returns no names for known placeholders only', () => {
    expect(findUnknownPlaceholders('{{username}} {{community}} {{reason}} {{duration}}')).toEqual(
      [],
    );
  });

  it('returns each unknown name once, in the order of the template', () => {
    expect(findUnknownPlaceholders('{{foo}} {{username}} {{bar}} {{foo}}')).toEqual(['foo', 'bar']);
  });

  it('returns a misspelled placeholder with its spaces', () => {
    expect(findUnknownPlaceholders('Hi {{ username }}')).toEqual([' username ']);
  });
});

describe('formatBanDuration', () => {
  it.each([
    [1, '1 day'],
    [3, '3 days'],
    [30, '30 days'],
    [null, 'permanent'],
  ])('formats %p as %p', (days, text) => {
    expect(formatBanDuration(days)).toBe(text);
  });
});
