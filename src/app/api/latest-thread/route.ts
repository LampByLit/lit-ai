import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

export async function GET() {
  console.log('=== Latest Thread API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    const threadPath = path.resolve(paths.analysisDir, 'latest-thread.json');
    console.log('Latest thread file path:', threadPath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Analysis dir exists:', fs.existsSync(path.dirname(threadPath)));
    console.log('- Thread file exists:', fs.existsSync(threadPath));

    // Create empty file if it doesn't exist
    if (!fs.existsSync(threadPath)) {
      console.log('Creating empty thread file');
      const dir = path.dirname(threadPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        if (process.env.RAILWAY_ENVIRONMENT === 'production') {
          fs.chmodSync(dir, '777');
        }
      }
      fs.writeFileSync(threadPath, JSON.stringify({
        lastModified: Date.now(),
        threadId: null,
        content: null
      }, null, 2));
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        fs.chmodSync(threadPath, '666');
      }
      console.log('Created empty thread file');
      return NextResponse.json({
        lastModified: Date.now(),
        threadId: null,
        content: null
      });
    }

    try {
      const data = JSON.parse(fs.readFileSync(threadPath, 'utf-8'));
      console.log('Successfully read thread file');
      
      if (!data || typeof data !== 'object') {
        console.log('Invalid thread data structure, returning empty data');
        return NextResponse.json({
          lastModified: Date.now(),
          threadId: null,
          content: null
        });
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error('Error reading thread file:', error);
      return NextResponse.json({
        lastModified: Date.now(),
        threadId: null,
        content: null
      });
    }
  } catch (error) {
    console.error('Error in latest-thread API:', error);
    return NextResponse.json({
      lastModified: Date.now(),
      threadId: null,
      content: null
    });
  }
} 