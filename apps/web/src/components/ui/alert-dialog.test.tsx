import { render, screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';
import { AlertDialog } from './alert-dialog';
import { Button } from './button';

function renderAlertDialog(props: Partial<ComponentProps<typeof AlertDialog>> = {}) {
  return render(
    <AlertDialog
      title="Archive “Spam”?"
      description="Moderators can no longer pick this reason."
      trigger={<Button>Archive</Button>}
      confirmLabel="Archive reason"
      confirmVariant="danger"
      {...props}
    />,
  );
}

describe('AlertDialog', () => {
  it('opens from its trigger with its title as the name and the focus on Cancel', async () => {
    const user = userEvent.setup();
    renderAlertDialog();

    await user.click(screen.getByRole('button', { name: 'Archive' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Archive “Spam”?' });
    expect(dialog).toHaveAccessibleDescription('Moderators can no longer pick this reason.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('does not close on a click outside', async () => {
    // A modal dialog sets `pointer-events: none` on <body>; the click goes there anyway.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderAlertDialog({ defaultOpen: true });

    await user.click(document.body);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('closes with Cancel without confirming and returns the focus to its trigger', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    renderAlertDialog({ onConfirm });
    const trigger = screen.getByRole('button', { name: 'Archive' });

    await user.click(trigger);
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    renderAlertDialog({ onConfirm, defaultOpen: true });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms and closes with the confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    renderAlertDialog({ onConfirm, defaultOpen: true });

    await user.click(screen.getByRole('button', { name: 'Archive reason' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows its body', () => {
    renderAlertDialog({ defaultOpen: true, children: <p>Used by 12 removals.</p> });

    expect(screen.getByText('Used by 12 removals.')).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    renderAlertDialog({ defaultOpen: true });

    // The dialog is in a portal at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
