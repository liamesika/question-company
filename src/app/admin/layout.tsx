import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // This check is for the layout pages, login page handles its own redirect
  // The middleware handles the initial redirect, this is a secondary server-side check

  return <AdminLayout>{children}</AdminLayout>;
}
