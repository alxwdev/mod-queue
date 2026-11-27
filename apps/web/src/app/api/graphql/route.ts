import 'server-only';
import { handleGraphQLRequest } from '@/server/graphql';

// Prisma and node-postgres need Node.js, and every response depends on the request.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return handleGraphQLRequest(request);
}

export function POST(request: Request): Promise<Response> {
  return handleGraphQLRequest(request);
}
