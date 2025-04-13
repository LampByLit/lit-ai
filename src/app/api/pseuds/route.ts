import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Use the DATA_DIR environment variable or fallback to a default path
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
    const pseudsPath = path.resolve(dataDir, 'pseuds.json');
    
    // Check if the file exists
    if (!fs.existsSync(pseudsPath)) {
      // Create an empty array if the file doesn't exist
      fs.writeFileSync(pseudsPath, '[]', 'utf8');
    }
    
    // Read the file
    const fileContent = fs.readFileSync(pseudsPath, 'utf8');
    const pseudsData = JSON.parse(fileContent);
    
    return NextResponse.json(pseudsData);
  } catch (error) {
    console.error('Error reading pseuds data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pseuds data' },
      { status: 500 }
    );
  }
} 