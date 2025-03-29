import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

export async function GET() {
  console.log('=== Recent Tweets API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    const tweetsPath = path.resolve(paths.analysisDir, 'recent-tweets.json');
    console.log('Tweets file path:', tweetsPath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Analysis dir exists:', fs.existsSync(path.dirname(tweetsPath)));
    console.log('- Tweets file exists:', fs.existsSync(tweetsPath));

    // Create empty file if it doesn't exist
    if (!fs.existsSync(tweetsPath)) {
      console.log('Creating empty tweets file');
      const dir = path.dirname(tweetsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        if (process.env.RAILWAY_ENVIRONMENT === 'production') {
          fs.chmodSync(dir, '777');
        }
      }
      fs.writeFileSync(tweetsPath, JSON.stringify({
        tweets: [],
        lastUpdated: Date.now()
      }, null, 2));
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        fs.chmodSync(tweetsPath, '666');
      }
      console.log('Created empty tweets file');
      return NextResponse.json({ success: true, tweets: [] });
    }

    try {
      const data = JSON.parse(fs.readFileSync(tweetsPath, 'utf-8'));
      console.log('Successfully read tweets file');
      
      if (!data || !Array.isArray(data.tweets)) {
        console.log('Invalid tweets data structure, returning empty array');
        return NextResponse.json({ success: true, tweets: [] });
      }

      return NextResponse.json({ success: true, tweets: data.tweets });
    } catch (error) {
      console.error('Error reading tweets file:', error);
      return NextResponse.json({ success: true, tweets: [] });
    }
  } catch (error) {
    console.error('Error in recent-tweets API:', error);
    return NextResponse.json({ success: true, tweets: [] });
  }
} 