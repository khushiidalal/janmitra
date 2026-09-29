import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isAuthorizedAdmin } from '@/lib/server/auth';

export async function proxy(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || !(await isAuthorizedAdmin(user))) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Administrator access required' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/audit-trail/:path*'],
};