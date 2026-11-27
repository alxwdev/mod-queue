import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';
import { Button } from './button';
import { Sheet } from './sheet';
import { TooltipProvider } from './tooltip';

function renderSheet(props: Partial<ComponentProps<typeof Sheet>> = {}) {
  return render(
    <>
      <Button>Outside</Button>
      <Sheet
        title="Report 1 of 3"
        trigger={<Button>Open item</Button>}
        footer={<Button variant="primary">Approve</Button>}
        {...props}
      >
        <Button>Next</Button>
      </Sheet>
    </>,
    { wrapper: TooltipProvider },
  );
}

describe('Sheet', () => {
  it('opens from its trigger with its title as the name', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: 'Open item' }));

    expect(screen.getByRole('dialog', { name: 'Report 1 of 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('keeps the focus inside while open', async () => {
    const user = userEvent.setup();
    renderSheet({ defaultOpen: true });
    const sheet = screen.getByRole('dialog', { name: 'Report 1 of 3' });
    const next = within(sheet).getByRole('button', { name: 'Next' });
    const approve = within(sheet).getByRole('button', { name: 'Approve' });
    const close = within(sheet).getByRole('button', { name: 'Close' });
    expect(next).toHaveFocus();

    await user.tab();
    expect(approve).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    // From the last control back to the first, not to "Outside".
    await user.tab();
    expect(next).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
  });

  it('forwards data-hotkeys-scope to the dialog element', () => {
    renderSheet({ defaultOpen: true, 'data-hotkeys-scope': 'queue' });

    expect(screen.getByRole('dialog', { name: 'Report 1 of 3' })).toHaveAttribute(
      'data-hotkeys-scope',
      'queue',
    );
  });

  it('closes on Escape and returns the focus to its trigger', async () => {
    const user = userEvent.setup();
    renderSheet();
    const trigger = screen.getByRole('button', { name: 'Open item' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations while open', async () => {
    renderSheet({ defaultOpen: true, description: 'Spam · 3 reports' });

    // The sheet is in a portal at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
