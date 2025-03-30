import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read the published data file
    const publicPath = path.resolve(process.cwd(), 'public', 'data.json');
    const content = await fs.readFile(publicPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Return the data with CORS headers
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error serving published data:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to load published data' }),
      { status: 500 }
    );
  }
} 