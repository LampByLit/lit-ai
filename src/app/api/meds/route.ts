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
    console.log('Looking for meds data at:', resultsPath);
    
    if (!fs.existsSync(resultsPath)) {
      console.log('No meds data file found at:', resultsPath);
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      console.log('Successfully read meds data file');
      
      const latestResult = Array.isArray(data.results) ? data.results[0] : null;
      
      if (!latestResult || !Array.isArray(latestResult.medsPosts)) {
        console.log('No valid meds posts found in data');
        return NextResponse.json([], { status: 200 }); // Return empty array instead of error
      }

      // Convert meds posts to the format expected by StagePost
      const formattedPosts = latestResult.medsPosts.map((post: MedsPost) => ({
        no: post.postId,
        time: Math.floor(post.timestamp / 1000),
        name: post.name,
        com: post.comment,
        replies: 0, // Not tracking replies for meds posts
        threadId: post.threadId
      }));

      console.log(`Returning ${formattedPosts.length} formatted meds posts`);
      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error(`Error reading meds results:`, error);
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
} 