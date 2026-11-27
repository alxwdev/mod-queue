'use client';

import { Ban, Check, ChevronDown, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Field } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

// The examples keep state (open, checked, the toasts), so they are client components; the page
// itself stays a server component.

const sizeNames = { sm: 'Small', md: 'Medium', lg: 'Large' } as const;

const rules = Array.from({ length: 30 }, (_, index) => `Rule ${index + 1}: be kind to each other.`);

/** A dialog with a form in its body and Cancel and Remove in its footer. */
export function DialogExample({
  size,
  long = false,
}: {
  size: 'sm' | 'md' | 'lg';
  long?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      size={size}
      title="Remove item"
      description="The author gets the message below."
      trigger={<Button>{long ? 'Long content' : sizeNames[size]}</Button>}
      footer={
        <>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form={formId} variant="danger">
            Remove
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
      >
        <Field label="Message to the user">
          <Textarea defaultValue="Hi {{username}}, your post was removed." />
        </Field>
        {long && (
          <ul className="space-y-3 text-sm">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        )}
      </form>
    </Dialog>
  );
}

/** A confirmation that only Cancel, Archive and `Esc` close. */
export function AlertDialogExample() {
  return (
    <AlertDialog
      title="Archive “Spam”?"
      description="Moderators can no longer pick this reason. Past removals keep it."
      trigger={<Button variant="danger">Archive reason</Button>}
      confirmLabel="Archive"
      confirmVariant="danger"
    />
  );
}

/** A sheet with a long body and the phone action bar in its footer. */
export function SheetExample({ side }: { side: 'right' | 'full' }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      side={side}
      title="Report 1 of 3"
      description="Home Gardening · Spam · 3 reports"
      data-hotkeys-scope="queue"
      trigger={<Button>{side === 'right' ? 'Right (tablet)' : 'Full (phone)'}</Button>}
      footer={
        <>
          <Button size="lg" variant="primary" onClick={() => setOpen(false)}>
            <Check />
            Approve
          </Button>
          <Button size="lg" onClick={() => setOpen(false)}>
            <Trash2 />
            Remove…
          </Button>
          <Button size="lg" onClick={() => setOpen(false)}>
            <Ban />
            Ban…
          </Button>
        </>
      }
    >
      {/*
        Controls, not only text: Radix's focus trap skips a scroll container without them, so a
        keyboard could not scroll the body.
      */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Rules broken</legend>
        {rules.map((rule) => (
          <Checkbox key={rule} label={rule} />
        ))}
      </fieldset>
    </Sheet>
  );
}

/** A filter menu with every kind of item. */
export function DropdownMenuExample() {
  const [reasons, setReasons] = useState<string[]>(['Spam']);
  const [sort, setSort] = useState('oldest');

  function toggleReason(reason: string, checked: boolean) {
    setReasons((current) =>
      checked ? [...current, reason] : current.filter((value) => value !== reason),
    );
  }

  return (
    <DropdownMenu
      trigger={
        <Button>
          Filters
          <ChevronDown />
        </Button>
      }
    >
      <DropdownMenuLabel>Reason</DropdownMenuLabel>
      {['Spam', 'Harassment', 'Misinformation'].map((reason) => (
        <DropdownMenuCheckboxItem
          key={reason}
          checked={reasons.includes(reason)}
          onCheckedChange={(checked) => toggleReason(reason, checked)}
        >
          {reason}
        </DropdownMenuCheckboxItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Sort</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
        <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="reports">Most reports</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => setReasons([])}>Clear reasons</DropdownMenuItem>
      <DropdownMenuItem disabled>Save view (disabled)</DropdownMenuItem>
    </DropdownMenu>
  );
}

/** One button for each kind of toast. */
export function ToastExamples() {
  const { show } = useToast();

  return (
    <>
      <Button
        onClick={() => show({ title: 'Undone', description: '1 item is back in the queue.' })}
      >
        Neutral
      </Button>
      <Button
        onClick={() =>
          show({
            variant: 'success',
            title: 'Approved',
            description: 'Press Z to undo',
            action: {
              label: 'Undo',
              onClick: () => show({ title: 'Undone', description: '1 item is back in the queue.' }),
            },
          })
        }
      >
        Success with Undo
      </Button>
      <Button
        onClick={() =>
          show({ variant: 'warning', title: '2 items were already handled by mod_birch' })
        }
      >
        Warning
      </Button>
      <Button
        onClick={() =>
          show({
            variant: 'danger',
            title: 'Couldn’t approve 1 item.',
            description: 'It’s back in the queue.',
            action: {
              label: 'Retry',
              onClick: () => show({ variant: 'success', title: 'Approved' }),
            },
          })
        }
      >
        Error with Retry
      </Button>
    </>
  );
}
