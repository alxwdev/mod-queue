import type { RequestHandler } from 'msw';

/** Default MSW handlers that every test starts with; a test overrides them with `server.use()`. */
export const handlers: RequestHandler[] = [];
