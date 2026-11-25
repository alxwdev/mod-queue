import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ModQueue',
  description: 'A keyboard-first console for community moderators.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
