import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('is a status with the label "Loading"', () => {
    render(<Spinner />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('says what is loading', () => {
    render(<Spinner label="Loading the queue" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading the queue');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Spinner />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
