import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface GreeksPost {
  postId: number;
  threadId: number;
  comment: string;
  timestamp: number;
  name: string;
}

interface AnalyzerResult {
  timestamp: number;
  threadId: number;
  postId: number;
  greeksPosts?: GreeksPost[];
  medsPosts?: GreeksPost[];
  metadata: {
    totalPostsAnalyzed: number;
    postsWithGreeks?: number;
    postsWithMeds?: number;
    lastAnalysis: number;
  };
}

export async function GET() {
  console.log('=== Greeks API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    const resultsPath = path.resolve(paths.dataDir, 'analysis', 'slur', 'results.json');
    console.log('Greeks analysis path:', resultsPath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Data dir exists:', fs.existsSync(paths.dataDir));
    console.log('- Analysis dir exists:', fs.existsSync(path.dirname(resultsPath)));
    console.log('- Analysis file exists:', fs.existsSync(resultsPath));

    // Return 404 if file doesn't exist
    if (!fs.existsSync(resultsPath)) {
      console.log('Greeks analysis file does not exist');
      return NextResponse.json(
        { error: 'No greeks data available' },
        { status: 404 }
      );
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      console.log('Successfully read greeks data file');
      
      // Find the most recent result that contains greeksPosts
      const latestResult = Array.isArray(data.results) 
        ? data.results.find((result: AnalyzerResult) => Array.isArray(result.greeksPosts))
        : null;
      
      if (!latestResult || !Array.isArray(latestResult.greeksPosts)) {
        console.log('No valid greek mentions found in data');
        return NextResponse.json(
          { error: 'No valid greek mentions available' },
          { status: 404 }
        );
      }

      // Convert posts to the format expected by StagePost
      const formattedPosts = latestResult.greeksPosts.map((post: GreeksPost) => ({
        no: post.postId,
        time: Math.floor(post.timestamp / 1000),
        name: post.name,
        com: post.comment,
        replies: 0,
        threadId: post.threadId
      }));

      console.log(`Returning ${formattedPosts.length} formatted greek mentions`);
      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error('Error reading greeks data:', error);
      return NextResponse.json(
        { error: 'Failed to read greeks data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in greeks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 