/** Sends an unexpected browser error to monitoring; a no-op until task 5.1 connects Sentry. */
export const reportClientError: (
  error: unknown,
  context: { operationName: string | undefined },
) => void = () => undefined;
