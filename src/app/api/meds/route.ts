import { NextResponse } from 'next/server';
import fs from 'fs';
import { paths } from '@/app/lib/utils/paths';

interface MedsPost {
  postId: number;
  threadId: number;
  comment: string;
  timestamp: number;
  name: string;
}

export async function GET() {
  try {
    const resultsPath = paths.analyzerResultsFile('slur');
    console.log('=== Meds API Debug Info ===');
    console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
    console.log('CWD:', process.cwd());
    console.log('Data Dir:', paths.dataDir);
    console.log('Looking for meds data at:', resultsPath);
    
    // Check directory structure
    console.log('Directory exists check:');
    console.log('- Data dir exists:', fs.existsSync(paths.dataDir));
    console.log('- Analysis dir exists:', fs.existsSync(paths.analysisDir));
    console.log('- Slur dir exists:', fs.existsSync(paths.analysisDir + '/slur'));
    
    if (!fs.existsSync(resultsPath)) {
      console.error(`Results file not found at: ${resultsPath}`);
      return NextResponse.json([], { status: 200 });
    }

    // Set proper permissions in Railway
    if (process.env.RAILWAY_ENVIRONMENT === 'production') {
      try {
        fs.chmodSync(resultsPath, '666');
      } catch (error) {
        console.error('Failed to set file permissions:', error);
      }
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      console.log('Successfully read meds data file');
      
      const latestResult = Array.isArray(data.results) ? data.results[0] : null;
      
      if (!latestResult || !Array.isArray(latestResult.medsPosts)) {
        console.log('No valid meds posts found in data');
        return NextResponse.json([], { status: 200 });
      }

      // Convert meds posts to the format expected by StagePost
      const formattedPosts = latestResult.medsPosts.map((post: MedsPost) => ({
        no: post.postId,
        time: Math.floor(post.timestamp / 1000),
        name: post.name,
        com: post.comment,
        replies: 0,
        threadId: post.threadId
      }));

      console.log(`Returning ${formattedPosts.length} formatted meds posts`);
      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error(`Error reading meds results:`, error);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json([], { status: 200 });
  }
} 