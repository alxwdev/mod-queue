import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ErrorState } from './error-state';

describe('ErrorState', () => {
  it('shows the message and retries with the Retry button', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <ErrorState
        title="Couldn't load the queue"
        description="Check your connection, then retry."
        onRetry={onRetry}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: "Couldn't load the queue" }),
    ).toBeInTheDocument();
    expect(screen.getByText('Check your connection, then retry.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('can be the heading of the page', () => {
    render(
      <ErrorState
        headingLevel={1}
        title="Something went wrong"
        description="Retry."
        onRetry={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <ErrorState title="Couldn't load the queue" description="Retry." onRetry={jest.fn()} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
