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
    
    if (!fs.existsSync(resultsPath)) {
      return NextResponse.json(
        { error: 'No meds data available' },
        { status: 404 }
      );
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      const latestResult = Array.isArray(data.results) ? data.results[0] : null;
      
      if (!latestResult || !Array.isArray(latestResult.medsPosts)) {
        return NextResponse.json(
          { error: 'Invalid data format' },
          { status: 500 }
        );
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

      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error(`Error reading meds results:`, error);
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 