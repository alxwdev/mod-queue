import { setupServer } from 'msw/node';
import { handlers } from '@/test/msw/handlers';

/** The MSW server of the web tests; `jest.setup.ts` starts it and resets its handlers after each test. */
export const server = setupServer(...handlers);
