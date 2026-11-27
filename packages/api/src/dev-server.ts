import type { IncomingMessage } from 'node:http';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createContext } from './context';
import { getPrisma } from './db';
import { systemClock } from './lib/clock';
import { createApolloServer } from './server';

const PORT = 4000;

// Node joins repeated request headers into one string, as the Fetch API does. Only `set-cookie`,
// a response header, comes as an array, so the loop skips nothing that a request carries.
function toHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (typeof value === 'string') headers.set(name, value);
  }
  return headers;
}

async function main(): Promise<void> {
  const prisma = getPrisma();
  const server = createApolloServer({
    // The standalone server runs only locally: print unexpected errors instead of sending them.
    reportError: (error, { operationName }) => {
      console.error(`Unexpected error in operation ${operationName ?? '(anonymous)'}:`, error);
    },
    isProduction: false,
  });
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: ({ req }) =>
      createContext({ request: { headers: toHeaders(req) }, prisma, now: systemClock }),
  });
  process.stdout.write(`GraphQL API and Apollo Sandbox: ${url}\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
