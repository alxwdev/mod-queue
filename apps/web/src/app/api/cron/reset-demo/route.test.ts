import { getPrisma, resetDemoData } from '@modqueue/api';
import { GET } from './route';

// A factory, not automock: the real package loads its seed, which imports faker (ES modules only).
jest.mock('@modqueue/api', () => ({
  getPrisma: jest.fn(() => 'prisma client'),
  resetDemoData: jest.fn(() => Promise.resolve({ visiblePending: 10_500 })),
}));

const resetDemoDataMock = jest.mocked(resetDemoData);

function cronRequest(authorization?: string): Request {
  const headers = authorization === undefined ? undefined : { authorization };
  return new Request('http://localhost/api/cron/reset-demo', { headers });
}

describe('GET /api/cron/reset-demo', () => {
  const cronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
    resetDemoDataMock.mockClear();
  });

  afterEach(() => {
    if (cronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = cronSecret;
  });

  it('answers 401 without an Authorization header', async () => {
    const response = await GET(cronRequest());

    expect(response.status).toBe(401);
    expect(resetDemoDataMock).not.toHaveBeenCalled();
  });

  it('answers 401 for a wrong secret', async () => {
    const response = await GET(cronRequest('Bearer wrong-secret'));

    expect(response.status).toBe(401);
    expect(resetDemoDataMock).not.toHaveBeenCalled();
  });

  it('answers 401 when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(cronRequest('Bearer undefined'));

    expect(response.status).toBe(401);
    expect(resetDemoDataMock).not.toHaveBeenCalled();
  });

  it('resets the demo data once for the correct secret', async () => {
    const response = await GET(cronRequest('Bearer test-cron-secret'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ visiblePending: 10_500 });
    expect(resetDemoDataMock).toHaveBeenCalledTimes(1);
    expect(resetDemoDataMock).toHaveBeenCalledWith(getPrisma(), 'full', expect.any(Date));
  });
});
