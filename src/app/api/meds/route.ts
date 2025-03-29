import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
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

  // Default post to return when no data exists
  const defaultPost = {
    no: Date.now(),
    time: Math.floor(Date.now() / 1000),
    name: 'Anonymous',
    com: 'Waiting for new posts...',
    replies: 0,
    threadId: Date.now()
  };

  try {
    const resultsPath = path.resolve(paths.dataDir, 'analysis', 'slur', 'results.json');
    console.log('Meds analysis path:', resultsPath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Data dir exists:', existsSync(paths.dataDir));
    console.log('- Analysis dir exists:', existsSync(path.dirname(resultsPath)));
    console.log('- Analysis file exists:', existsSync(resultsPath));

    // Create empty file if it doesn't exist
    if (!existsSync(resultsPath)) {
      console.log('Creating empty meds analysis file');
      const dir = path.dirname(resultsPath);
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        if (process.env.RAILWAY_ENVIRONMENT === 'production') {
          await fs.chmod(dir, 0o777);
        }
      }
      
      // Write initial data to temp file
      const tempFile = `${resultsPath}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify({
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

      // Set permissions on temp file
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        await fs.chmod(tempFile, 0o666);
      }

      // Rename temp file to final file (atomic operation)
      await fs.rename(tempFile, resultsPath);

      // Set permissions on final file
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        await fs.chmod(resultsPath, 0o666);
      }

      console.log('Created empty meds analysis file');
      return NextResponse.json([defaultPost, defaultPost, defaultPost]);
    }

    try {
      const data = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
      console.log('Successfully read meds data file');
      
      // Ensure we have valid results array
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.log('No valid meds data found, returning default posts');
        return NextResponse.json([defaultPost, defaultPost, defaultPost]);
      }

      const latestResult = data.results[0];
      
      // Ensure we have valid meds posts
      if (!latestResult || !Array.isArray(latestResult.medsPosts) || latestResult.medsPosts.length === 0) {
        console.log('No valid meds posts found, returning default posts');
        return NextResponse.json([defaultPost, defaultPost, defaultPost]);
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

      // If we have fewer than 3 posts, pad with default posts
      while (formattedPosts.length < 3) {
        formattedPosts.push(defaultPost);
      }

      console.log(`Returning ${formattedPosts.length} formatted meds posts`);
      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error('Error reading meds results:', error);
      return NextResponse.json([defaultPost, defaultPost, defaultPost]);
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json([defaultPost, defaultPost, defaultPost]);
  }
} 