import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './button';
import { ToastProvider, useToast } from './toast';

type ShowOptions = Parameters<ReturnType<typeof useToast>['show']>[0];

function ShowButton(options: ShowOptions) {
  const { show } = useToast();
  return <Button onClick={() => show(options)}>Show</Button>;
}

/** The live region that Radix fills with the toast's text on the next frame. */
async function findAnnouncement(text: string) {
  const announcement = await screen.findByRole('status');
  await waitFor(() => expect(announcement).toHaveTextContent(text));
  return announcement;
}

function renderShowButton(options: ShowOptions) {
  return render(<ShowButton {...options} />, { wrapper: ToastProvider });
}

describe('Toast', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the title and the description', async () => {
    const user = userEvent.setup();
    renderShowButton({ title: 'Approved', description: 'Press Z to undo' });

    await user.click(screen.getByRole('button', { name: 'Show' }));

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Press Z to undo')).toBeInTheDocument();
  });

  it('makes its action reachable by keyboard', async () => {
    const user = userEvent.setup();
    const onUndo = jest.fn();
    renderShowButton({ title: 'Approved', action: { label: 'Undo', onClick: onUndo } });

    await user.click(screen.getByRole('button', { name: 'Show' }));
    // F8 moves the focus to the list of toasts; Tab goes to the newest toast, then into it.
    await user.keyboard('[F8]');
    const region = screen.getByRole('region', { name: 'Notifications (F8)' });
    expect(within(region).getByRole('list')).toHaveFocus();
    await user.tab();
    expect(within(region).getByRole('listitem')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('announces an error toast at once (foreground)', async () => {
    const user = userEvent.setup();
    renderShowButton({ title: 'Couldn’t approve 1 item.', variant: 'danger' });

    await user.click(screen.getByRole('button', { name: 'Show' }));

    const announcement = await findAnnouncement('Couldn’t approve 1 item.');
    expect(announcement).toHaveAttribute('aria-live', 'assertive');
  });

  it('announces other toasts politely (background)', async () => {
    const user = userEvent.setup();
    renderShowButton({ title: 'Approved', description: 'Press Z to undo', variant: 'success' });

    await user.click(screen.getByRole('button', { name: 'Show' }));

    // With a space between the title and the description.
    const announcement = await findAnnouncement('Approved Press Z to undo');
    expect(announcement).toHaveAttribute('aria-live', 'polite');
  });

  it('announces the altText of the action in place of its label', async () => {
    const user = userEvent.setup();
    renderShowButton({
      title: 'Approved',
      action: { label: 'Undo', altText: 'Press Z to undo', onClick: () => {} },
    });

    await user.click(screen.getByRole('button', { name: 'Show' }));

    const announcement = await findAnnouncement('Approved Press Z to undo');
    expect(announcement).not.toHaveTextContent('Undo');
  });

  it('closes with the Close button', async () => {
    const user = userEvent.setup();
    renderShowButton({ title: 'Approved' });

    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('closes after its duration', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: (ms) => jest.advanceTimersByTime(ms) });
    renderShowButton({ title: 'Approved', duration: 1000 });

    await user.click(screen.getByRole('button', { name: 'Show' }));
    act(() => jest.advanceTimersByTime(999));
    expect(screen.getByText('Approved')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('keeps earlier toasts when it shows a new one', async () => {
    const user = userEvent.setup();
    renderShowButton({ title: 'Approved' });

    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Show' }));

    expect(screen.getAllByText('Approved')).toHaveLength(2);
  });

  it('needs a ToastProvider', () => {
    // React logs the thrown error; keep the test output clean.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ShowButton title="Approved" />)).toThrow(
      'useToast needs a ToastProvider above it.',
    );
  });

  it('has no axe violations while open', async () => {
    const user = userEvent.setup();
    renderShowButton({
      title: 'Couldn’t approve 1 item.',
      description: 'It’s back in the queue.',
      variant: 'danger',
      action: { label: 'Retry', onClick: () => {} },
    });

    await user.click(screen.getByRole('button', { name: 'Show' }));
    await findAnnouncement('Couldn’t approve 1 item.');

    // The viewport and the announcement are at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
