import type { QueryResolvers, QueueHealthResolvers } from '../generated/resolvers-types';
import {
  getMedianTimeToAction,
  getQueueSummary,
  getReportsPerHour,
  getTopReasons,
} from '../services/health-service';

export const healthQueryResolvers: QueryResolvers = {
  queueHealth: () => ({}),
};

// Field resolvers, so a client that asks only for the summary runs no chart queries.
export const queueHealthResolvers: QueueHealthResolvers = {
  summary: (_parent, _args, ctx) => getQueueSummary(ctx),
  reportsPerHour: (_parent, { hours }, ctx) => getReportsPerHour(ctx, hours),
  medianTimeToAction: (_parent, { days }, ctx) => getMedianTimeToAction(ctx, days),
  topReasons: (_parent, { days, limit }, ctx) => getTopReasons(ctx, days, limit),
};
