import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Field } from './field';
import { Select } from './select';

function renderDurationSelect() {
  return render(
    <Field label="Duration">
      <Select defaultValue="1">
        <option value="1">1 day</option>
        <option value="7">7 days</option>
        <option value="">Permanent</option>
      </Select>
    </Field>,
  );
}

describe('Select', () => {
  it('renders as a native select with its accessible name', () => {
    renderDurationSelect();

    expect(screen.getByRole('combobox', { name: 'Duration' })).toHaveDisplayValue('1 day');
  });

  it('changes the value', async () => {
    const user = userEvent.setup();
    renderDurationSelect();
    const select = screen.getByRole('combobox', { name: 'Duration' });

    await user.selectOptions(select, '7 days');

    expect(select).toHaveValue('7');
  });

  it('has no axe violations in any state', async () => {
    const { container } = render(
      <>
        <Field label="Default">
          <Select>
            <option>One</option>
          </Select>
        </Field>
        <Field label="Invalid" error="Choose a value.">
          <Select>
            <option>One</option>
          </Select>
        </Field>
        <Field label="Disabled">
          <Select disabled>
            <option>One</option>
          </Select>
        </Field>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
