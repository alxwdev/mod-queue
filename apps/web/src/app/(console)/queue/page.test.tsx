import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { renderWithProviders } from '@/test/render';
import QueuePage from './page';

describe('QueuePage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<QueuePage />, { route: '/queue' });

    expect(screen.getByRole('heading', { level: 1, name: 'Queue' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<QueuePage />, { route: '/queue' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
