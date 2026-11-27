'use client';

import { Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { useSettings } from '@/features/settings/use-settings';

/** The header menu with the moderator's settings. */
export function SettingsMenu() {
  const { shortcutsEnabled, updateSettings } = useSettings();

  return (
    <DropdownMenu
      align="end"
      trigger={
        <IconButton label="Settings" variant="ghost" size="sm">
          <Settings />
        </IconButton>
      }
    >
      <DropdownMenuCheckboxItem
        checked={shortcutsEnabled}
        onCheckedChange={(checked) => updateSettings({ shortcutsEnabled: checked })}
      >
        Single-key shortcuts
      </DropdownMenuCheckboxItem>
    </DropdownMenu>
  );
}
