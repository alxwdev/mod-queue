import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Queue health · ModQueue',
};

export default function QueueHealthPage() {
  return <PageHeader title="Queue health" />;
}
