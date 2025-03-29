import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp } from './startup';

let initPromise: Promise<boolean> | null = null;
let initError: Error | null = null;

export async function middleware(request: NextRequest) {
  // Skip initialization check for static files and _next
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // If we already had an initialization error, return it
  if (initError) {
    console.error('Previous initialization failed:', initError);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Application failed to initialize',
        message: initError.message,
        stack: process.env.NODE_ENV === 'development' ? initError.stack : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize only once
    if (!initPromise) {
      console.log('=== Starting Application Initialization ===');
      console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
      console.log('CWD:', process.cwd());
      console.log('Node Version:', process.version);
      console.log('Platform:', process.platform);
      
      initPromise = initializeApp().catch(error => {
        initError = error;
        throw error;
      });
    }

    // Wait for initialization to complete
    await initPromise;

    // Continue to the actual request
    return NextResponse.next();
  } catch (error) {
    // Log detailed error information
    console.error('=== Initialization Error ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('=== Environment Info ===');
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
    console.error('CWD:', process.cwd());
    console.error('Platform:', process.platform);
    console.error('Architecture:', process.arch);

    // Store the error for future requests
    initError = error instanceof Error ? error : new Error(String(error));

    // Return a more detailed error response
    return new NextResponse(
      JSON.stringify({ 
        error: 'Application initialization failed',
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          railway: process.env.RAILWAY_ENVIRONMENT,
          platform: process.platform,
          arch: process.arch
        }
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 