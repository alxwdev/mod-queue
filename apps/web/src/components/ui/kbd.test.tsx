import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Kbd } from './kbd';

describe('Kbd', () => {
  it('renders the key as keyboard input', () => {
    render(
      <p>
        Press <Kbd>Z</Kbd> to undo
      </p>,
    );

    expect(screen.getByText('Z', { selector: 'kbd' })).toBeInTheDocument();
    expect(screen.getByRole('paragraph')).toHaveTextContent('Press Z to undo');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <p>
        <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
      </p>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
