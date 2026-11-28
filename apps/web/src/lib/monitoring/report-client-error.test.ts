import { captureException } from '@sentry/nextjs';
import { reportClientError } from './report-client-error';

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));

const captureExceptionMock = jest.mocked(captureException);

describe('reportClientError', () => {
  beforeEach(() => captureExceptionMock.mockClear());

  it('sends the error to Sentry with its operation name as a tag', () => {
    const error = new Error('Network failure');

    reportClientError(error, { operationName: 'Queue' });

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { 'graphql.operation': 'Queue' },
    });
  });

  it('sends an error without an operation without a tag', () => {
    const error = new Error('Render failure');

    reportClientError(error, { operationName: undefined });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, undefined);
  });
});
