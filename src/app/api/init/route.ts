import { NextResponse } from 'next/server';
import { initialize } from '@/app/lib/init';

export async function GET() {
  try {
    const result = await initialize();
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unexpected initialization error'
      },
      { status: 500 }
    );
  }
} 