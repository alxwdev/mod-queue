import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { reportClientError } from '@/lib/monitoring/report-client-error';
import { renderWithProviders } from '@/test/render';
import RootError from './error';

// A relative path: SWC resolves the @/ alias only in imports, not in jest.mock().
jest.mock('../lib/monitoring/report-client-error');

describe('RootError', () => {
  const error = new Error('The shell failed.');

  it('reports the error once and retries with the Retry button', async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    renderWithProviders(<RootError error={error} retry={retry} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(reportClientError).toHaveBeenCalledTimes(1);
    expect(reportClientError).toHaveBeenCalledWith(error, { operationName: undefined });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<RootError error={error} retry={jest.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
