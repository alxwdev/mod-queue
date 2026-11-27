import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Badge } from './badge';

const variants = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;

describe('Badge', () => {
  it('renders its text in every variant', () => {
    render(
      <>
        {variants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant} badge
          </Badge>
        ))}
      </>,
    );

    for (const variant of variants) {
      expect(screen.getByText(`${variant} badge`)).toBeInTheDocument();
    }
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <p>
        {variants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </p>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
