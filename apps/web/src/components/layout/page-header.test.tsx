import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('shows the page title as the level 1 heading', () => {
    render(<PageHeader title="Mod log" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Mod log' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<PageHeader title="Mod log" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
