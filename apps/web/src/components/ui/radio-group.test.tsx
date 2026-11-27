import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { RadioGroup, RadioGroupItem } from './radio-group';

function renderSortGroup(onValueChange?: (value: string) => void) {
  return render(
    <RadioGroup
      label="Sort"
      description="The order of the queue"
      defaultValue="oldest"
      onValueChange={onValueChange}
    >
      <RadioGroupItem value="oldest" label="Oldest first" />
      <RadioGroupItem value="newest" label="Newest first" />
      <RadioGroupItem value="reports" label="Most reports" description="Ties: oldest first" />
    </RadioGroup>,
  );
}

describe('RadioGroup', () => {
  it('renders the group and its items with their names and descriptions', () => {
    renderSortGroup();

    const group = screen.getByRole('radiogroup', { name: 'Sort' });
    expect(group).toHaveAccessibleDescription('The order of the queue');
    expect(screen.getByRole('radio', { name: 'Oldest first' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Most reports' })).toHaveAccessibleDescription(
      'Ties: oldest first',
    );
  });

  it('moves and selects with the arrow keys', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    renderSortGroup(onValueChange);
    // Radix moves the focus in a timeout and selects only while an arrow key is down, as it is in
    // a browser: hold the key until the focus has moved.
    async function press(key: string) {
      await user.keyboard(`{${key}>}`);
      await user.keyboard(`{/${key}}`);
    }

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Oldest first' })).toHaveFocus();

    await press('ArrowDown');
    expect(screen.getByRole('radio', { name: 'Newest first' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Newest first' })).toBeChecked();

    await press('ArrowUp');
    await press('ArrowUp');
    expect(screen.getByRole('radio', { name: 'Most reports' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Most reports' })).toBeChecked();
    expect(onValueChange.mock.calls).toEqual([['newest'], ['oldest'], ['reports']]);
  });

  it('is one tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RadioGroup label="Sort" defaultValue="newest">
          <RadioGroupItem value="oldest" label="Oldest first" />
          <RadioGroupItem value="newest" label="Newest first" />
        </RadioGroup>
        <button type="button">After</button>
      </>,
    );

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Newest first' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <RadioGroup label="Sort" defaultValue="oldest">
        <RadioGroupItem value="oldest" label="Oldest first" description="A description" />
        <RadioGroupItem value="newest" label="Newest first" />
        <RadioGroupItem value="reports" label="Most reports" disabled />
      </RadioGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
