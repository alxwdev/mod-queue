import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './button';
import { Tooltip, TooltipProvider } from './tooltip';

function renderTooltip() {
  return render(
    <Tooltip content="Approve the item">
      <Button>Approve</Button>
    </Tooltip>,
    { wrapper: TooltipProvider },
  );
}

describe('Tooltip', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens on hover after 400 ms', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: (ms) => jest.advanceTimersByTime(ms) });
    renderTooltip();

    await user.hover(screen.getByRole('button', { name: 'Approve' }));
    act(() => jest.advanceTimersByTime(399));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Approve the item');
  });

  it('opens on keyboard focus and describes its trigger', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Approve the item');
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAccessibleDescription(
      'Approve the item',
    );
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    await screen.findByRole('tooltip');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    await screen.findByRole('tooltip');

    // The tooltip is in a portal at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
