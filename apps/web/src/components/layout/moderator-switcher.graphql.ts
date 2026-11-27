import { graphql } from '@/gql';

export const MODERATOR_SWITCHER_QUERY = graphql(`
  query ModeratorSwitcher {
    me {
      id
      username
    }
    moderators {
      id
      username
    }
  }
`);
