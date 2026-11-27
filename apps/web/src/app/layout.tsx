import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/app/providers';
import './globals.css';

// globals.css builds --font-sans from this variable.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ModQueue',
  description: 'A keyboard-first console for community moderators.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-canvas text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
