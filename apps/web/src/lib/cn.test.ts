import { cn } from './cn';

describe('cn', () => {
  it('joins conditional class names', () => {
    expect(cn('px-2', false, null, undefined, { 'text-fg': true, 'text-xs': false })).toBe(
      'px-2 text-fg',
    );
  });

  it('keeps the later class of the same group', () => {
    expect(cn('px-2 bg-accent', 'px-4 bg-danger')).toBe('px-4 bg-danger');
  });

  it('keeps a text size and a text colour token together', () => {
    expect(cn('text-sm', 'text-fg-muted')).toBe('text-sm text-fg-muted');
    expect(cn('text-fg', 'text-fg-muted')).toBe('text-fg-muted');
  });

  it('merges the duration tokens', () => {
    expect(cn('duration-fast', 'duration-base')).toBe('duration-base');
  });

  it('merges the z-index tokens', () => {
    expect(cn('z-sticky', 'z-overlay', 'z-dropdown', 'z-toast')).toBe('z-toast');
  });
});
