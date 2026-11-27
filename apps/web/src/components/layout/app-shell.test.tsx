import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { graphql, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { AppShell } from './app-shell';

// Next.js gives usePathname its value through the App Router, which Jest does not run: read the
// path that renderWithProviders puts into the URL.
jest.mock('next/navigation', () => ({ usePathname: () => window.location.pathname }));

const moderator = { __typename: 'Moderator', id: 'm1', username: 'mod_aurora' };

const navLinks = ['Queue', 'Mod log', 'Queue health', 'Removal reasons'];

function renderShell(route = '/queue') {
  return renderWithProviders(
    <AppShell>
      <h1>Queue</h1>
    </AppShell>,
    { route },
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    server.use(
      graphql
        .link('/api/graphql')
        .query('ModeratorSwitcher', () =>
          HttpResponse.json({ data: { me: moderator, moderators: [moderator] } }),
        ),
    );
  });

  it('moves the focus to main with the skip link, the first stop of the Tab key', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('reaches the header controls and every navigation link by keyboard', async () => {
    const user = userEvent.setup();
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const switcher = await screen.findByRole('button', { name: 'Acting as mod_aurora' });

    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
    await user.tab();
    expect(switcher).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    for (const name of navLinks) {
      await user.tab();
      expect(within(nav).getByRole('link', { name })).toHaveFocus();
    }
  });

  it('links to the four console screens', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/queue', '/log', '/health', '/reasons']);
  });

  it.each([
    ['/queue', 'Queue'],
    ['/log', 'Mod log'],
    ['/health', 'Queue health'],
    ['/reasons', 'Removal reasons'],
    ['/reasons/new', 'Removal reasons'],
  ])('marks the link of %s as the current page', (route, current) => {
    renderShell(route);
    const nav = screen.getByRole('navigation', { name: 'Main' });

    for (const name of navLinks) {
      const link = within(nav).getByRole('link', { name });
      if (name === current) expect(link).toHaveAttribute('aria-current', 'page');
      else expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('opens the navigation in the menu sheet and closes the sheet when a link is chosen', async () => {
    const user = userEvent.setup();
    renderShell('/queue');

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const sheet = screen.getByRole('dialog', { name: 'Menu' });
    const sheetLink = within(sheet).getByRole('link', { name: 'Queue' });

    // Radix focuses the first control of the body.
    await waitFor(() => expect(sheetLink).toHaveFocus());
    expect(sheetLink).toHaveAttribute('aria-current', 'page');
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    renderShell();
    await screen.findByRole('button', { name: 'Acting as mod_aurora' });

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations with the menu sheet open', async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByRole('button', { name: 'Acting as mod_aurora' });

    await user.click(screen.getByRole('button', { name: 'Menu' }));

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
