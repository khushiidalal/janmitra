import { cookies } from 'next/headers';
import { forbidden } from 'next/navigation';
import { getAuthenticatedUserFromToken, isAuthorizedAdmin } from '@/lib/server/auth';

export default async function AuditTrailLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const user = token ? await getAuthenticatedUserFromToken(token) : null;

  if (!user || !(await isAuthorizedAdmin(user))) {
    forbidden();
  }

  return children;
}