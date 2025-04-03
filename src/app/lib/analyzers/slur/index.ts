import { Thread, Post } from '../../../types/interfaces';
import { BaseAnalyzer } from '../base';
import { SlurAnalyzerResult, GreeksPost } from './types';

/**
 * Analyzer for tracking occurrences of "greeks" in posts
 */
export class SlurAnalyzer extends BaseAnalyzer<SlurAnalyzerResult> {
  name = 'slur';
  description = 'Tracks occurrences of "greeks" mentions in posts';

  // Term to track (case-insensitive)
  private static TRACKED_TERM = 'greeks';
  private static MAX_POSTS = 3;

  /**
   * Check if text contains the word "greeks"
   */
  private hasGreeks(text: string): boolean {
    const regex = new RegExp(`\\b${SlurAnalyzer.TRACKED_TERM}\\b`, 'gi');
    return regex.test(text.toLowerCase());
  }

  /**
   * Process a post to track greeks mentions
   */
  private processPost(
    post: Post,
    thread: Thread,
    greeksPostsSet: Set<GreeksPost>
  ): void {
    if (!post.com) return;

    if (this.hasGreeks(post.com)) {
      const greeksPost: GreeksPost = {
        postId: post.no,
        threadId: thread.no,
        comment: post.com,
        timestamp: post.time * 1000, // Convert to milliseconds
        name: post.name || 'Anonymous'
      };
      greeksPostsSet.add(greeksPost);
    }
  }

  /**
   * Analyze threads for greeks mentions
   */
  async analyze(threads: Thread[]): Promise<SlurAnalyzerResult[]> {
    console.log('Starting greeks analysis...');
    
    const greeksPostsSet = new Set<GreeksPost>();
    let totalPosts = 0;

    // Process each thread
    for (const thread of threads) {
      if (!thread.posts) continue;

      // Process OP post
      if (thread.com) {
        this.processPost(
          {
            no: thread.no,
            resto: 0,
            time: thread.time,
            name: thread.name || 'Anonymous',
            com: thread.com
          },
          thread,
          greeksPostsSet
        );
        totalPosts++;
      }

      // Process each reply
      for (const post of thread.posts) {
        this.processPost(post, thread, greeksPostsSet);
        totalPosts++;
      }
    }

    // Convert Set to Array and sort by timestamp (newest first)
    const greeksPosts = Array.from(greeksPostsSet)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, SlurAnalyzer.MAX_POSTS);

    // Create single result
    return [{
      timestamp: Date.now(),
      threadId: threads[0]?.no || -1,
      postId: threads[0]?.posts?.[0]?.no || -1,
      greeksPosts: greeksPosts,
      metadata: {
        totalPostsAnalyzed: totalPosts,
        postsWithGreeks: greeksPostsSet.size,
        lastAnalysis: Date.now()
      }
    }];
  }
} 