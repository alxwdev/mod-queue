import 'server-only';
import { resetDemoData } from '@modqueue/api';
import { getPrisma } from '@/server/prisma';

// Prisma and node-postgres need Node.js, and every request changes the data.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// The full preset inserts about 50,000 rows in one transaction.
export const maxDuration = 60;

/** Replaces all data with the `full` demo data; Vercel Cron calls it once a day with CRON_SECRET. */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  // Without a secret, refuse every request: "Bearer undefined" must not pass.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const summary = await resetDemoData(getPrisma(), 'full', new Date());
  return Response.json(summary);
}
