import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';
import { Button } from './button';
import { Dialog } from './dialog';
import { TooltipProvider } from './tooltip';

function renderDialog(props: Partial<ComponentProps<typeof Dialog>> = {}) {
  return render(
    <Dialog
      title="Remove item"
      description="The author gets a message."
      trigger={<Button>Remove…</Button>}
      footer={<Button variant="danger">Remove</Button>}
      {...props}
    >
      <label>
        Note <input />
      </label>
    </Dialog>,
    { wrapper: TooltipProvider },
  );
}

describe('Dialog', () => {
  it('opens from its trigger with its title as the name and its description', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Remove…' }));

    const dialog = screen.getByRole('dialog', { name: 'Remove item' });
    expect(dialog).toHaveAccessibleDescription('The author gets a message.');
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus();
  });

  it('closes on Escape and returns the focus to its trigger', async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole('button', { name: 'Remove…' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes with the Close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    await user.click(screen.getByRole('button', { name: 'Remove…' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('closes on a click outside', async () => {
    // A modal dialog sets `pointer-events: none` on <body>; the click goes there anyway.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderDialog({ defaultOpen: true });

    await user.click(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes onCloseAutoFocus through, so the caller can move the focus elsewhere', async () => {
    const user = userEvent.setup();
    const focusNextItem = jest.fn((event: Event) => {
      event.preventDefault();
      // `hidden`: Radix still hides the rest of the page from the accessibility tree here.
      screen.getByRole('button', { name: 'Next item', hidden: true }).focus();
    });
    render(
      <>
        <Button>Next item</Button>
        <Dialog
          title="Remove item"
          trigger={<Button>Remove…</Button>}
          onCloseAutoFocus={focusNextItem}
        >
          <Button>Remove</Button>
        </Dialog>
      </>,
      { wrapper: TooltipProvider },
    );
    await user.click(screen.getByRole('button', { name: 'Remove…' }));
    await user.keyboard('{Escape}');

    // Radix moves the focus in a timeout after the dialog unmounts.
    await waitFor(() => expect(focusNextItem).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Next item' })).toHaveFocus();
  });

  it('has no description when none is given', () => {
    renderDialog({ description: undefined, defaultOpen: true });

    expect(screen.getByRole('dialog', { name: 'Remove item' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('shows the footer', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    renderDialog({ defaultOpen: true });

    // The dialog is in a portal at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
