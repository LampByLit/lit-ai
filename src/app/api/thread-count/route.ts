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
    console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
    console.log('CWD:', process.cwd());
    console.log('Data Dir:', paths.dataDir);
    console.log('Threads Dir:', threadsDir);
    
    // Check if directory exists
    const dirExists = existsSync(threadsDir);
    console.log('Directory exists:', dirExists);

    // Create directory if it doesn't exist
    if (!dirExists) {
      console.log('Creating threads directory');
      await fs.mkdir(threadsDir, { recursive: true });
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        await fs.chmod(threadsDir, 0o777);
      }
      console.log('Created threads directory');
      return NextResponse.json({ 
        count: 0, 
        exists: true,
        status: 'initializing',
        message: 'Waiting for first scrape...'
      });
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
          return { 
            file, 
            valid: stats.isFile() && stats.size > 0,
            size: stats.size,
            mtime: stats.mtime
          };
        } catch {
          return { 
            file, 
            valid: false,
            size: 0,
            mtime: new Date(0)
          };
        }
      })
    );

    // Count only valid files
    const validFiles = fileStats.filter(f => f.valid);
    console.log('Valid JSON files:', validFiles.length);

    // Get most recent file modification time
    const mostRecent = validFiles.reduce((latest, current) => 
      current.mtime > latest ? current.mtime : latest, 
      new Date(0)
    );
    
    return NextResponse.json({
      count: validFiles.length,
      exists: true,
      status: validFiles.length > 0 ? 'active' : 'waiting',
      message: validFiles.length > 0 
        ? `Tracking ${validFiles.length} threads` 
        : 'Waiting for first scrape...',
      debug: {
        threadsDir,
        dirExists,
        fileCount: allFiles.length,
        jsonCount: jsonFiles.length,
        validCount: validFiles.length,
        lastUpdate: mostRecent.toISOString()
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
          count: 0,
          exists: false,
          status: 'error',
          message: 'Error checking thread count',
          error: error.message,
          stack: error.stack
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        count: 0,
        exists: false,
        status: 'error',
        message: 'Unknown error checking thread count'
      },
      { status: 500 }
    );
  }
} 