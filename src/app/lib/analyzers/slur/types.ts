import { AnalyzerResult } from '../../../types/interfaces';

/**
 * Structure for a post containing "greeks"
 */
export interface GreeksPost {
  postId: number;        // ID of the post
  threadId: number;      // ID of the thread containing this post
  comment: string;       // The post content
  timestamp: number;     // When the post was made
  name: string;         // Name of the poster
}

/**
 * Result structure for Greeks analysis
 */
export interface SlurAnalyzerResult extends AnalyzerResult {
  greeksPosts: GreeksPost[];  // Posts containing "greeks"
  metadata: {
    totalPostsAnalyzed: number;     // Total number of posts processed
    postsWithGreeks: number;          // Number of posts containing "greeks"
    lastAnalysis: number;           // Timestamp of previous analysis
  };
} 