import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { X } from 'lucide-react';
import { VisuallyHidden } from './visually-hidden';

describe('VisuallyHidden', () => {
  it('gives its text to the accessible name', () => {
    render(
      <button type="button">
        <X />
        <VisuallyHidden>Close</VisuallyHidden>
      </button>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <button type="button">
        <X />
        <VisuallyHidden>Close</VisuallyHidden>
      </button>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
