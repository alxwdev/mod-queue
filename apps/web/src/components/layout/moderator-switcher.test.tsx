import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { graphql, http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { ModeratorSwitcher } from './moderator-switcher';

const moderators = ['mod_aurora', 'mod_birch', 'mod_cedar'].map((username, index) => ({
  __typename: 'Moderator' as const,
  id: `m${index + 1}`,
  username,
}));

// Like the API: the acting moderator comes from the cookie, else it is mod_aurora. Node's fetch
// sends no cookies, so the handler reads them from the document.
function actingUsername() {
  return /(?:^|; )mq_moderator=([^;]*)/.exec(document.cookie)?.[1] ?? 'mod_aurora';
}

function useModeratorHandler() {
  let requests = 0;
  server.use(
    graphql.link('/api/graphql').query('ModeratorSwitcher', () => {
      requests += 1;
      const me = moderators.find((moderator) => moderator.username === actingUsername());
      return HttpResponse.json({ data: { me, moderators } });
    }),
  );
  return () => requests;
}

describe('ModeratorSwitcher', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.cookie = 'mq_moderator=; Path=/; Max-Age=0';
  });

  it('shows the acting moderator', async () => {
    useModeratorHandler();
    renderWithProviders(<ModeratorSwitcher />);

    expect(await screen.findByRole('button', { name: 'Acting as mod_aurora' })).toBeInTheDocument();
  });

  it('sets the cookie, announces the moderator and reloads the data as that moderator', async () => {
    const user = userEvent.setup();
    const requestCount = useModeratorHandler();
    // document.cookie shows no attributes: watch what the switcher writes.
    const writeCookie = jest.spyOn(Document.prototype, 'cookie', 'set');
    renderWithProviders(<ModeratorSwitcher />);

    await user.click(await screen.findByRole('button', { name: 'Acting as mod_aurora' }));
    expect(screen.getByRole('menuitemradio', { name: 'mod_aurora' })).toBeChecked();
    await user.click(screen.getByRole('menuitemradio', { name: 'mod_birch' }));

    expect(document.cookie).toBe('mq_moderator=mod_birch');
    expect(writeCookie).toHaveBeenCalledWith(
      'mq_moderator=mod_birch; Path=/; Max-Age=31536000; SameSite=Lax',
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Now acting as mod_birch'),
    );
    expect(await screen.findByRole('button', { name: 'Acting as mod_birch' })).toBeInTheDocument();
    expect(requestCount()).toBe(2);
  });

  it('switches by keyboard', async () => {
    const user = userEvent.setup();
    useModeratorHandler();
    renderWithProviders(<ModeratorSwitcher />);
    await screen.findByRole('button', { name: 'Acting as mod_aurora' });

    await user.tab();
    await user.keyboard('{Enter}');
    // The first item is focused when the menu opens from the keyboard.
    await user.keyboard('{ArrowDown}{Enter}');

    expect(document.cookie).toBe('mq_moderator=mod_birch');
    expect(await screen.findByRole('button', { name: 'Acting as mod_birch' })).toHaveFocus();
  });

  it('offers a retry when the moderators do not load', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/graphql', () => new HttpResponse('Bad gateway', { status: 502 })));
    renderWithProviders(<ModeratorSwitcher />);

    const retry = await screen.findByRole('button', {
      name: "Couldn't load the moderators. Retry",
    });
    useModeratorHandler();
    await user.click(retry);

    expect(await screen.findByRole('button', { name: 'Acting as mod_aurora' })).toBeInTheDocument();
  });

  it('has no axe violations with the menu open', async () => {
    const user = userEvent.setup();
    useModeratorHandler();
    renderWithProviders(<ModeratorSwitcher />);

    await user.click(await screen.findByRole('button', { name: 'Acting as mod_aurora' }));

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
