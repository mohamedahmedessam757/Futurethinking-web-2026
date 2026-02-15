import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Note: In a real NextAuth v5 setup, you would import { auth } from "./auth"
// For this structure, we verify the session token.

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define Protected Routes
  const isAdminRoute = path.startsWith('/admin');
  const isConsultantRoute = path.startsWith('/consultant');
  const isStudentRoute = path.startsWith('/dashboard');

  // 2. Get Token (Mocking the check for the prototype)
  // In production: const token = await getToken({ req: request });
  const tokenCookie = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');
  
  // 3. Auth Guard
  if ((isAdminRoute || isConsultantRoute || isStudentRoute) && !tokenCookie) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // 4. Role Guard (RBAC)
  // This requires the token to actually contain the 'role'. 
  // We assume the JWT callback in NextAuth adds user.role to the token.
  
  /* 
  // Pseudo-code for Role Verification logic:
  if (isAdminRoute && token.role !== 'admin') {
     return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (isConsultantRoute && token.role !== 'instructor' && token.role !== 'consultant') {
     return NextResponse.redirect(new URL('/dashboard', request.url)); // Fallback to student dash
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/consultant/:path*',
    '/dashboard/:path*',
    '/api/ai/:path*' // Protect AI API routes
  ],
};