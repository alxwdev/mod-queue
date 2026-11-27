import { isInaccessible, render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is hidden from screen readers', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);

    // A Skeleton has no role, name or text that a Testing Library query could find.
    // eslint-disable-next-line testing-library/no-node-access
    const skeleton = container.firstElementChild;
    expect(skeleton).not.toBeNull();
    expect(isInaccessible(skeleton as Element)).toBe(true);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-18 w-full" />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
