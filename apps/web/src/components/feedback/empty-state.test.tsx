import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('shows the title as a level 2 heading, the description and the action', () => {
    render(
      <EmptyState
        title="The queue is empty"
        description="New reports appear here."
        action={<a href="/log">Open the mod log</a>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'The queue is empty' }),
    ).toBeInTheDocument();
    expect(screen.getByText('New reports appear here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the mod log' })).toBeInTheDocument();
  });

  it('can be the heading of the page', () => {
    render(<EmptyState headingLevel={1} title="Page not found" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <EmptyState title="The queue is empty" description="New reports appear here." />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
