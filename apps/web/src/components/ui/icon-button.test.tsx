import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';
import { TooltipProvider } from './tooltip';

describe('IconButton', () => {
  it('renders with its label as the accessible name', () => {
    render(
      <IconButton label="Close">
        <X />
      </IconButton>,
      { wrapper: TooltipProvider },
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('shows the label in a tooltip on keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <IconButton label="Close">
        <X />
      </IconButton>,
      { wrapper: TooltipProvider },
    );

    await user.tab();

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Close');
  });

  it('activates with Enter', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <IconButton label="Close" onClick={onClick}>
        <X />
      </IconButton>,
      { wrapper: TooltipProvider },
    );

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('requires a label', () => {
    render(
      // @ts-expect-error An IconButton without `label` has no accessible name.
      <IconButton>
        <X />
      </IconButton>,
      { wrapper: TooltipProvider },
    );

    expect(screen.getByRole('button')).not.toHaveAccessibleName();
  });

  it('has no axe violations with its tooltip open', async () => {
    const user = userEvent.setup();
    render(
      <IconButton label="Close" variant="ghost">
        <X />
      </IconButton>,
      { wrapper: TooltipProvider },
    );

    await user.tab();
    await screen.findByRole('tooltip');

    // The tooltip is in a portal at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
