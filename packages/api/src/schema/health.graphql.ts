export const healthTypeDefs = /* GraphQL */ `
  type QueueSummary {
    pendingCount: Int!
    reportsLast24h: Int!
    handledLast24h: Int!
    medianMinutesLast24h: Float
  }

  type HourlyCount {
    hour: DateTime!
    count: Int!
  }

  type DailyMedian {
    day: DateTime!
    medianMinutes: Float
  }

  type QueueHealth {
    summary: QueueSummary!
    reportsPerHour(hours: Int = 48): [HourlyCount!]! # max 168, zero-filled, UTC buckets
    medianTimeToAction(days: Int = 14): [DailyMedian!]! # max 30, UTC days
    topReasons(days: Int = 14, limit: Int = 6): [ReasonCount!]!
  }

  extend type Query {
    queueHealth: QueueHealth!
  }
`;
