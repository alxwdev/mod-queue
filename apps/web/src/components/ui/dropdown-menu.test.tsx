import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from './dropdown-menu';

function FilterMenu({ onSelectAll }: { onSelectAll?: () => void }) {
  const [spam, setSpam] = useState(false);
  const [sort, setSort] = useState('oldest');

  return (
    <DropdownMenu trigger={<Button>Filters</Button>}>
      <DropdownMenuItem onSelect={onSelectAll}>Select all</DropdownMenuItem>
      <DropdownMenuItem disabled>Export</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Reason</DropdownMenuLabel>
      <DropdownMenuCheckboxItem checked={spam} onCheckedChange={setSpam}>
        Spam
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Sort</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
        <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('opens from its trigger with Enter and focuses the first item', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);
    const trigger = screen.getByRole('button', { name: 'Filters' });

    await user.tab();
    await user.keyboard('{Enter}');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Select all' })).toHaveFocus();
  });

  it('moves with the arrow keys and skips disabled items, labels and separators', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Spam' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Oldest first' })).toHaveFocus();

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Select all' })).toHaveFocus();
  });

  it('runs an item and closes, returning the focus to the trigger', async () => {
    const user = userEvent.setup();
    const onSelectAll = jest.fn();
    render(<FilterMenu onSelectAll={onSelectAll} />);
    const trigger = screen.getByRole('button', { name: 'Filters' });

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('toggles a checkbox item', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const spam = screen.getByRole('menuitemcheckbox', { name: 'Spam' });
    expect(spam).not.toBeChecked();
    await user.click(spam);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('menuitemcheckbox', { name: 'Spam' })).toBeChecked();
  });

  it('toggles a checkbox item with Space', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);

    await user.tab();
    await user.keyboard('{Enter}{ArrowDown}');
    await user.keyboard(' ');

    await user.keyboard('{Enter}{ArrowDown}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Spam' })).toBeChecked();
  });

  it('selects one radio item of a group', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('menuitemradio', { name: 'Oldest first' })).toBeChecked();
    await user.click(screen.getByRole('menuitemradio', { name: 'Newest first' }));

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('menuitemradio', { name: 'Newest first' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Oldest first' })).not.toBeChecked();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
  });

  it('keeps the rest of the page in the accessibility tree while open', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button>Outside</Button>
        <FilterMenu />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outside' })).toBeInTheDocument();
  });

  it('closes on a click outside', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button>Outside</Button>
        <FilterMenu />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const user = userEvent.setup();
    render(<FilterMenu />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    // The menu is in a portal at the end of <body>.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
