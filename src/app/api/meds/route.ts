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

    // Create empty file if it doesn't exist
    if (!fs.existsSync(resultsPath)) {
      console.log('Creating empty meds analysis file');
      const dir = path.dirname(resultsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        if (process.env.RAILWAY_ENVIRONMENT === 'production') {
          fs.chmodSync(dir, '777');
        }
      }
      fs.writeFileSync(resultsPath, JSON.stringify({
        lastUpdated: Date.now(),
        results: [{
          timestamp: Date.now(),
          threadId: -1,
          postId: -1,
          medsPosts: [],
          metadata: {
            totalPostsAnalyzed: 0,
            postsWithMeds: 0,
            lastAnalysis: Date.now()
          }
        }]
      }, null, 2));
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        fs.chmodSync(resultsPath, '666');
      }
      console.log('Created empty meds analysis file');
      return NextResponse.json([{
        no: 0,
        time: Math.floor(Date.now() / 1000),
        name: 'Anonymous',
        com: 'No meds data available yet',
        replies: 0,
        threadId: 0
      }]);
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      console.log('Successfully read meds data file');
      
      // Ensure we have valid results array
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.log('No valid meds data found, returning default post');
        return NextResponse.json([{
          no: 0,
          time: Math.floor(Date.now() / 1000),
          name: 'Anonymous',
          com: 'No meds data available',
          replies: 0,
          threadId: 0
        }]);
      }

      const latestResult = data.results[0];
      
      // Ensure we have valid meds posts
      if (!latestResult || !Array.isArray(latestResult.medsPosts)) {
        console.log('No valid meds posts found, returning default post');
        return NextResponse.json([{
          no: 0,
          time: Math.floor(Date.now() / 1000),
          name: 'Anonymous',
          com: 'No meds posts available',
          replies: 0,
          threadId: 0
        }]);
      }

      // Convert meds posts to the format expected by StagePost
      const formattedPosts = latestResult.medsPosts.map((post: MedsPost) => ({
        no: post.postId,
        time: Math.floor(post.timestamp / 1000),
        name: post.name || 'Anonymous',
        com: post.comment || '',
        replies: 0,
        threadId: post.threadId
      }));

      // If we have no formatted posts, return default post
      if (formattedPosts.length === 0) {
        return NextResponse.json([{
          no: 0,
          time: Math.floor(Date.now() / 1000),
          name: 'Anonymous',
          com: 'No recent meds posts',
          replies: 0,
          threadId: 0
        }]);
      }

      console.log(`Returning ${formattedPosts.length} formatted meds posts`);
      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error('Error reading meds results:', error);
      return NextResponse.json([{
        no: 0,
        time: Math.floor(Date.now() / 1000),
        name: 'Anonymous',
        com: 'Error reading meds data',
        replies: 0,
        threadId: 0
      }]);
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json([{
      no: 0,
      time: Math.floor(Date.now() / 1000),
      name: 'Anonymous',
      com: 'Error in meds API',
      replies: 0,
      threadId: 0
    }]);
  }
} 