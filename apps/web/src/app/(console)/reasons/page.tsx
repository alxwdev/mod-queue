import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Removal reasons · ModQueue',
};

export default function RemovalReasonsPage() {
  return <PageHeader title="Removal reasons" />;
}
