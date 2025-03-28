import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { paths } from '@/app/utils/paths';
import path from 'path';

export async function GET() {
  try {
    // Use paths utility to get threads directory
    const threadsDir = paths.threadsDir;

    // Debug logging
    console.log('=== Thread Count Debug Info ===');
    console.log('Threads Dir:', threadsDir);
    console.log('CWD:', process.cwd());
    
    // Check if directory exists
    const dirExists = existsSync(threadsDir);
    console.log('Directory exists:', dirExists);

    if (!dirExists) {
      console.log('Threads directory does not exist');
      return NextResponse.json({ count: 0, exists: false });
    }

    // List directory contents
    const allFiles = await fs.readdir(threadsDir);
    console.log('All files in directory:', allFiles);

    // Filter JSON files
    const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
    console.log('JSON files count:', jsonFiles.length);

    // Get file stats to ensure they're valid files
    const fileStats = await Promise.all(
      jsonFiles.map(async file => {
        try {
          const stats = await fs.stat(path.join(threadsDir, file));
          return { file, valid: stats.isFile() && stats.size > 0 };
        } catch {
          return { file, valid: false };
        }
      })
    );

    // Count only valid files
    const validFiles = fileStats.filter(f => f.valid);
    console.log('Valid JSON files:', validFiles.length);
    
    return NextResponse.json({
      count: validFiles.length,
      exists: true,
      debug: {
        threadsDir,
        dirExists,
        fileCount: allFiles.length,
        jsonCount: jsonFiles.length,
        validCount: validFiles.length
      }
    });
  } catch (error: unknown) {
    console.error('=== Thread Count Error ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { 
          error: 'Failed to get thread count', 
          details: error.message,
          stack: error.stack
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get thread count' },
      { status: 500 }
    );
  }
} 