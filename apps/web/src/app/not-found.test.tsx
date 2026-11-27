import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { renderWithProviders } from '@/test/render';
import NotFound from './not-found';

describe('NotFound', () => {
  it('says that the page does not exist and links to the queue', () => {
    renderWithProviders(<NotFound />, { route: '/missing' });

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the queue' })).toHaveAttribute('href', '/queue');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<NotFound />, { route: '/missing' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
