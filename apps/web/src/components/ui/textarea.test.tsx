import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Field } from './field';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders with its accessible name and takes typed lines', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Message">
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Message' });

    await user.click(textarea);
    await user.keyboard('Hello{Enter}there');

    expect(textarea).toHaveValue('Hello\nthere');
  });

  it('has no axe violations in any state', async () => {
    const { container } = render(
      <>
        <Field label="Default">
          <Textarea placeholder="Placeholder" />
        </Field>
        <Field label="Invalid" error="Enter a message.">
          <Textarea />
        </Field>
        <Field label="Disabled">
          <Textarea disabled />
        </Field>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
