import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Field } from './field';
import { Input } from './input';

describe('Input', () => {
  it('renders with its accessible name and takes typed text', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Search">
        <Input type="search" />
      </Field>,
    );
    const input = screen.getByRole('searchbox', { name: 'Search' });

    await user.click(input);
    await user.keyboard('spam');

    expect(input).toHaveValue('spam');
  });

  it('works without a Field', () => {
    render(<Input aria-label="Search" />);

    expect(screen.getByRole('textbox', { name: 'Search' })).not.toHaveAttribute('aria-invalid');
  });

  it('has no axe violations in any state', async () => {
    const { container } = render(
      <>
        <Field label="Default">
          <Input placeholder="Placeholder" />
        </Field>
        <Field label="Invalid" error="Enter a value.">
          <Input />
        </Field>
        <Field label="Disabled">
          <Input disabled />
        </Field>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
