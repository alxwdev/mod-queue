import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders with its label as the accessible name', () => {
    render(<Checkbox label="Select all" />);

    expect(screen.getByRole('checkbox', { name: 'Select all' })).not.toBeChecked();
  });

  it('toggles with Space but not with Enter', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Checkbox label="Select all" onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' });

    await user.tab();
    await user.keyboard('{Enter}');
    expect(checkbox).not.toBeChecked();

    await user.keyboard(' ');
    expect(checkbox).toBeChecked();
    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('toggles on a click on its label', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Select all" />);

    await user.click(screen.getByText('Select all'));

    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  });

  it('shows the indeterminate state as mixed', () => {
    render(<Checkbox label="Select all" checked="indeterminate" />);

    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBePartiallyChecked();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Select all" disabled />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' });

    await user.click(checkbox);

    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
  });

  it('has no axe violations in any state', async () => {
    const { container } = render(
      <>
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Indeterminate" checked="indeterminate" />
        <Checkbox label="Disabled" disabled />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
