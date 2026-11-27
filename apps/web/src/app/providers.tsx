import type { ReactNode } from 'react';
import { AnnouncerProvider } from '@/components/feedback/announcer';
import { ToastProvider } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SettingsProvider } from '@/features/settings/settings-provider';
import { ApolloProvider } from '@/lib/apollo/apollo-provider';

/** The app-wide providers; the root layout and `renderWithProviders` both use them. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider>
      <SettingsProvider>
        <AnnouncerProvider>
          <ToastProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ToastProvider>
        </AnnouncerProvider>
      </SettingsProvider>
    </ApolloProvider>
  );
}
