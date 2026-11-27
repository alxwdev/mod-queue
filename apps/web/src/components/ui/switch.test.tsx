import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders with its label as the name and its description', () => {
    render(<Switch label="Single-key shortcuts" description="J, K, A, R, B, Z and ?" />);

    const toggle = screen.getByRole('switch', { name: 'Single-key shortcuts' });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription('J, K, A, R, B, Z and ?');
  });

  it('toggles with Space and Enter', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Switch label="Single-key shortcuts" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Single-key shortcuts' });

    await user.tab();
    await user.keyboard(' ');
    expect(toggle).toBeChecked();
    await user.keyboard('{Enter}');
    expect(toggle).not.toBeChecked();
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('toggles on a click on its label', async () => {
    const user = userEvent.setup();
    render(<Switch label="Single-key shortcuts" defaultChecked />);

    await user.click(screen.getByText('Single-key shortcuts'));

    expect(screen.getByRole('switch', { name: 'Single-key shortcuts' })).not.toBeChecked();
  });

  it('has no axe violations in any state', async () => {
    const { container } = render(
      <>
        <Switch label="Off" description="A description" />
        <Switch label="On" defaultChecked />
        <Switch label="Disabled" disabled />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
