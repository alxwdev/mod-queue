import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { renderWithProviders } from '@/test/render';
import { SettingsMenu } from './settings-menu';

describe('SettingsMenu', () => {
  afterEach(() => window.localStorage.clear());

  it('turns single-key shortcuts off by keyboard and remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<SettingsMenu />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    await user.keyboard('{Enter}');
    const item = screen.getByRole('menuitemcheckbox', { name: 'Single-key shortcuts' });
    expect(item).toBeChecked();
    expect(item).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    unmount();
    renderWithProviders(<SettingsMenu />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Single-key shortcuts' }),
    ).not.toBeChecked();
  });

  it('has no axe violations with the menu open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsMenu />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
