import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Mod log · ModQueue',
};

export default function ModLogPage() {
  return <PageHeader title="Mod log" />;
}
