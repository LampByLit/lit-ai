import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface MedsPost {
  postId: number;
  threadId: number;
  comment: string;
  timestamp: number;
  name: string;
}

export async function GET() {
  console.log('=== Meds API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    const resultsPath = path.resolve(paths.dataDir, 'analysis', 'slur', 'results.json');
    console.log('Meds analysis path:', resultsPath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Data dir exists:', fs.existsSync(paths.dataDir));
    console.log('- Analysis dir exists:', fs.existsSync(path.dirname(resultsPath)));
    console.log('- Analysis file exists:', fs.existsSync(resultsPath));

    // Return empty array if file doesn't exist
    if (!fs.existsSync(resultsPath)) {
      console.log('Meds analysis file does not exist, returning empty array');
      return NextResponse.json([]);
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      console.log('Successfully read meds data file');
      
      // Ensure we have valid results array
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.log('No valid meds data found, returning empty array');
        return NextResponse.json([]);
      }

      const latestResult = data.results[0];
      
      // Ensure we have valid meds posts
      if (!latestResult || !Array.isArray(latestResult.medsPosts)) {
        console.log('No valid meds posts found, returning empty array');
        return NextResponse.json([]);
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
      console.error('Error reading meds results:', error);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json([]);
  }
} 