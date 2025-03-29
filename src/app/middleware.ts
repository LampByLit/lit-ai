import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp } from './startup';

let initPromise: Promise<boolean> | null = null;

export async function middleware(request: NextRequest) {
  // Skip initialization check for static files and _next
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  try {
    // Initialize only once
    if (!initPromise) {
      console.log('Starting initialization in middleware...');
      initPromise = initializeApp();
    }

    // Wait for initialization to complete
    await initPromise;

    // Continue to the actual request
    return NextResponse.next();
  } catch (error) {
    console.error('Initialization failed in middleware:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Application initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 