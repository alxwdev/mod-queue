import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AnnouncerProvider, useAnnounce } from './announcer';

function AnnounceButtons() {
  const announce = useAnnounce();
  return (
    <>
      <button type="button" onClick={() => announce('Saved')}>
        Save
      </button>
      <button type="button" onClick={() => announce('Connection lost', 'assertive')}>
        Disconnect
      </button>
    </>
  );
}

function renderAnnouncer() {
  return render(
    <AnnouncerProvider>
      <AnnounceButtons />
    </AnnouncerProvider>,
  );
}

describe('AnnouncerProvider', () => {
  it('announces a message in the polite region', async () => {
    const user = userEvent.setup();
    renderAnnouncer();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved'));
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('announces the same message twice: it clears the region, then sets the text again', async () => {
    const user = userEvent.setup();
    renderAnnouncer();
    const region = screen.getByRole('status');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(region).toHaveTextContent('Saved'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(region).toBeEmptyDOMElement();
    await waitFor(() => expect(region).toHaveTextContent('Saved'));
  });

  it('announces an assertive message in the assertive region', async () => {
    const user = userEvent.setup();
    renderAnnouncer();

    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connection lost'));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('keeps the regions out of aria-hidden: both have an explicit aria-live', () => {
    renderAnnouncer();

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('has no axe violations', async () => {
    const { container } = renderAnnouncer();

    expect(await axe(container)).toHaveNoViolations();
  });
});
