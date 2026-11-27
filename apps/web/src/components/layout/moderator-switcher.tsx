'use client';

import { useApolloClient, useQuery } from '@apollo/client/react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { useAnnounce } from '@/components/feedback/announcer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { writeModeratorCookie } from '@/lib/moderator-cookie';
import { MODERATOR_SWITCHER_QUERY } from './moderator-switcher.graphql';

// The queries show their own errors, and the error link reports them: a failed refetch after a
// switch or a retry needs nothing more here.
function ignoreRejection() {}

/** Shows the acting moderator and switches to another one; all data then reloads as that moderator. */
export function ModeratorSwitcher() {
  const client = useApolloClient();
  const announce = useAnnounce();
  const { data: currentData, previousData, error, refetch } = useQuery(MODERATOR_SWITCHER_QUERY);
  // After a switch the cache is empty until the refetch returns. The previous data keeps the
  // trigger on the page, and the focus that the menu returns to it.
  const data = currentData ?? previousData;

  function switchTo(username: string) {
    writeModeratorCookie(username);
    announce(`Now acting as ${username}`);
    // The cache holds data of the previous moderator: clear it and run the active queries again.
    client.resetStore().catch(ignoreRejection);
  }

  function retry() {
    refetch().catch(ignoreRejection);
  }

  if (error) {
    return (
      <Button variant="ghost" size="sm" onClick={retry}>
        <CircleAlert className="text-danger" />
        <VisuallyHidden>Couldn&apos;t load the moderators.</VisuallyHidden> Retry
      </Button>
    );
  }

  if (!data) return <Skeleton className="h-8 w-28" />;

  return (
    <DropdownMenu
      align="end"
      trigger={
        // The button and its inner span may shrink, so a long name is cut with an ellipsis.
        <Button variant="ghost" size="sm" className="max-w-40 min-w-0 shrink px-2 [&>span]:min-w-0">
          <VisuallyHidden>Acting as</VisuallyHidden>{' '}
          <span className="truncate">{data.me.username}</span>
          <ChevronDown />
        </Button>
      }
    >
      <DropdownMenuLabel>Act as</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={data.me.username} onValueChange={switchTo}>
        {data.moderators.map((moderator) => (
          <DropdownMenuRadioItem key={moderator.id} value={moderator.username}>
            {moderator.username}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenu>
  );
}
