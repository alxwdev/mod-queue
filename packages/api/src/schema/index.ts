import { baseTypeDefs } from './base.graphql';
import { healthTypeDefs } from './health.graphql';
import { modLogTypeDefs } from './mod-log.graphql';
import { moderationTypeDefs } from './moderation.graphql';
import { queueTypeDefs } from './queue.graphql';
import { removalReasonsTypeDefs } from './removal-reasons.graphql';

// The order sets the field order of Query and Mutation, which matches the SDL in api.md.
export const typeDefs: string[] = [
  baseTypeDefs,
  queueTypeDefs,
  moderationTypeDefs,
  modLogTypeDefs,
  removalReasonsTypeDefs,
  healthTypeDefs,
];
