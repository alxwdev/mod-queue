import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Field } from './field';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';

describe('Field', () => {
  it('labels its control', () => {
    render(
      <Field label="Title">
        <Input />
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).not.toHaveAccessibleDescription();
    expect(input).not.toBeInvalid();
  });

  it('links the error text through aria-describedby and marks the control invalid', () => {
    render(
      <Field label="Title" error="Enter a title.">
        <Input />
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).toHaveAccessibleDescription('Enter a title.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeInvalid();
  });

  it('links the description and the error, in that order', () => {
    render(
      <Field
        label="Message"
        description="Sent to the author."
        error="Use at most 1,000 characters."
      >
        <Textarea />
      </Field>,
    );

    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAccessibleDescription(
      'Sent to the author. Use at most 1,000 characters.',
    );
  });

  it('wires a Select', () => {
    render(
      <Field label="Duration" description="How long the ban lasts.">
        <Select>
          <option>1 day</option>
          <option>Permanent</option>
        </Select>
      </Field>,
    );

    expect(screen.getByRole('combobox', { name: 'Duration' })).toHaveAccessibleDescription(
      'How long the ban lasts.',
    );
  });

  it("keeps the control's own id and descriptions", () => {
    render(
      <>
        <p id="hint">Visible to other moderators.</p>
        <Field label="Note" id="note" error="Too long.">
          <Input aria-describedby="hint" />
        </Field>
      </>,
    );

    const input = screen.getByRole('textbox', { name: 'Note' });
    expect(input).toHaveAttribute('id', 'note');
    expect(input).toHaveAccessibleDescription('Too long. Visible to other moderators.');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Field label="Title" description="Shown in the menu.">
          <Input />
        </Field>
        <Field label="Message" error="Enter a message.">
          <Textarea />
        </Field>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
