import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Queue · ModQueue',
};

export default function QueuePage() {
  return <PageHeader title="Queue" />;
}
