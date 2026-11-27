import { gql, InMemoryCache, type TypedDocumentNode } from '@apollo/client';
import { typePolicies } from './type-policies';

interface Connection {
  __typename: string;
  totalCount: number;
  edges: { __typename: string; cursor: string; node: { __typename: string; id: string } }[];
  pageInfo: { __typename: 'PageInfo'; hasNextPage: boolean; endCursor: string | null };
}

interface QueueVariables {
  first?: number;
  after?: string;
  filter?: { reasons: string[] };
  sort?: string;
}

interface ModLogVariables {
  first?: number;
  after?: string;
  filter?: { types: string[] };
}

const QUEUE: TypedDocumentNode<{ queue: Connection }, QueueVariables> = gql`
  query TestQueue($first: Int, $after: String, $filter: QueueFilter, $sort: QueueSort) {
    queue(first: $first, after: $after, filter: $filter, sort: $sort) {
      totalCount
      edges {
        cursor
        node {
          id
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const MOD_LOG: TypedDocumentNode<{ modLog: Connection }, ModLogVariables> = gql`
  query TestModLog($first: Int, $after: String, $filter: ModLogFilter) {
    modLog(first: $first, after: $after, filter: $filter) {
      totalCount
      edges {
        cursor
        node {
          id
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/** A page of `ids`, as the API returns it for a connection of `nodeType` items. */
function page(
  nodeType: 'Content' | 'ModAction',
  ids: string[],
  { hasNextPage, totalCount }: { hasNextPage: boolean; totalCount: number },
): Connection {
  return {
    __typename: `${nodeType}Connection`,
    totalCount,
    edges: ids.map((id) => ({
      __typename: `${nodeType}Edge`,
      cursor: `cursor-${id}`,
      node: { __typename: nodeType, id },
    })),
    pageInfo: { __typename: 'PageInfo', hasNextPage, endCursor: `cursor-${ids.at(-1)}` },
  };
}

function ids(connection: Connection | undefined) {
  return connection?.edges.map((edge) => edge.node.id);
}

describe('typePolicies', () => {
  describe('Query.queue', () => {
    const spam = { reasons: ['SPAM'] };
    const offTopic = { reasons: ['OFF_TOPIC'] };

    it('merges the next page into the list of the same filter and sort', () => {
      const cache = new InMemoryCache({ typePolicies });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, filter: spam, sort: 'OLDEST' },
        data: { queue: page('Content', ['c1', 'c2'], { hasNextPage: true, totalCount: 3 }) },
      });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, after: 'cursor-c2', filter: spam, sort: 'OLDEST' },
        data: { queue: page('Content', ['c3'], { hasNextPage: false, totalCount: 3 }) },
      });

      const result = cache.readQuery({ query: QUEUE, variables: { filter: spam, sort: 'OLDEST' } });

      expect(ids(result?.queue)).toEqual(['c1', 'c2', 'c3']);
      expect(result?.queue.pageInfo).toMatchObject({ hasNextPage: false, endCursor: 'cursor-c3' });
    });

    it('stores different filters separately', () => {
      const cache = new InMemoryCache({ typePolicies });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, filter: spam, sort: 'OLDEST' },
        data: { queue: page('Content', ['c1', 'c2'], { hasNextPage: false, totalCount: 2 }) },
      });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, filter: offTopic, sort: 'OLDEST' },
        data: { queue: page('Content', ['c3'], { hasNextPage: false, totalCount: 1 }) },
      });

      const spamResult = cache.readQuery({
        query: QUEUE,
        variables: { filter: spam, sort: 'OLDEST' },
      });
      const offTopicResult = cache.readQuery({
        query: QUEUE,
        variables: { filter: offTopic, sort: 'OLDEST' },
      });

      expect(ids(spamResult?.queue)).toEqual(['c1', 'c2']);
      expect(spamResult?.queue.totalCount).toBe(2);
      expect(ids(offTopicResult?.queue)).toEqual(['c3']);
      expect(offTopicResult?.queue.totalCount).toBe(1);
    });

    it('stores different sorts separately', () => {
      const cache = new InMemoryCache({ typePolicies });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, filter: spam, sort: 'OLDEST' },
        data: { queue: page('Content', ['c1', 'c2'], { hasNextPage: false, totalCount: 2 }) },
      });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, filter: spam, sort: 'NEWEST' },
        data: { queue: page('Content', ['c2', 'c1'], { hasNextPage: false, totalCount: 2 }) },
      });

      const oldest = cache.readQuery({ query: QUEUE, variables: { filter: spam, sort: 'OLDEST' } });
      const newest = cache.readQuery({ query: QUEUE, variables: { filter: spam, sort: 'NEWEST' } });

      expect(ids(oldest?.queue)).toEqual(['c1', 'c2']);
      expect(ids(newest?.queue)).toEqual(['c2', 'c1']);
    });

    it('keeps totalCount after a merge', () => {
      const cache = new InMemoryCache({ typePolicies });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, filter: spam, sort: 'OLDEST' },
        data: { queue: page('Content', ['c1', 'c2'], { hasNextPage: true, totalCount: 3 }) },
      });
      cache.writeQuery({
        query: QUEUE,
        variables: { first: 2, after: 'cursor-c2', filter: spam, sort: 'OLDEST' },
        data: { queue: page('Content', ['c3'], { hasNextPage: false, totalCount: 3 }) },
      });

      const result = cache.readQuery({ query: QUEUE, variables: { filter: spam, sort: 'OLDEST' } });

      expect(result?.queue.totalCount).toBe(3);
    });
  });

  describe('Query.modLog', () => {
    const approvals = { types: ['APPROVE'] };
    const bans = { types: ['BAN'] };

    it('merges the next page into the list of the same filter', () => {
      const cache = new InMemoryCache({ typePolicies });
      cache.writeQuery({
        query: MOD_LOG,
        variables: { first: 2, filter: approvals },
        data: { modLog: page('ModAction', ['a1', 'a2'], { hasNextPage: true, totalCount: 3 }) },
      });
      cache.writeQuery({
        query: MOD_LOG,
        variables: { first: 2, after: 'cursor-a2', filter: approvals },
        data: { modLog: page('ModAction', ['a3'], { hasNextPage: false, totalCount: 3 }) },
      });

      const result = cache.readQuery({ query: MOD_LOG, variables: { filter: approvals } });

      expect(ids(result?.modLog)).toEqual(['a1', 'a2', 'a3']);
      expect(result?.modLog.totalCount).toBe(3);
    });

    it('stores different filters separately', () => {
      const cache = new InMemoryCache({ typePolicies });
      cache.writeQuery({
        query: MOD_LOG,
        variables: { first: 2, filter: approvals },
        data: { modLog: page('ModAction', ['a1', 'a2'], { hasNextPage: false, totalCount: 2 }) },
      });
      cache.writeQuery({
        query: MOD_LOG,
        variables: { first: 2, filter: bans },
        data: { modLog: page('ModAction', ['a3'], { hasNextPage: false, totalCount: 1 }) },
      });

      const approvalResult = cache.readQuery({ query: MOD_LOG, variables: { filter: approvals } });
      const banResult = cache.readQuery({ query: MOD_LOG, variables: { filter: bans } });

      expect(ids(approvalResult?.modLog)).toEqual(['a1', 'a2']);
      expect(ids(banResult?.modLog)).toEqual(['a3']);
    });
  });
});
