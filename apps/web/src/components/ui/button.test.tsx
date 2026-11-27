import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { FormEvent } from 'react';
import { Button } from './button';

describe('Button', () => {
  it('renders with its accessible name', () => {
    render(<Button variant="primary">Approve</Button>);

    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute('type', 'button');
  });

  it('activates with Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Approve</Button>);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('ignores activation while loading, and stays focusable and named', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Approve
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Approve' });

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(button);

    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeEnabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit its form while loading', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((event: FormEvent) => event.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Save
        </Button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations in any variant or state', async () => {
    const { container } = render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary" size="sm">
          Secondary
        </Button>
        <Button variant="ghost" size="lg">
          Ghost
        </Button>
        <Button variant="danger" disabled>
          Danger
        </Button>
        <Button loading>Loading</Button>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
