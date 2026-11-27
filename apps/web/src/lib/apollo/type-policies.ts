import type { TypePolicies } from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

/** The cache keeps one list per filter (and sort) and appends each next page to it. */
export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      queue: relayStylePagination(['filter', 'sort']),
      modLog: relayStylePagination(['filter']),
    },
  },
};
