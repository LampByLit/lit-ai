import { DeepSeekClient } from './deepseek';
import { ArticleAnalysis, ArticleGeneratorConfig, ArticleGeneratorOptions, ArticleStats } from '../types/article';
import { paths } from '../utils/paths';
import path from 'path';
import fs from 'fs/promises';

const DEFAULT_CONFIG: ArticleGeneratorConfig = {
  maxTokens: 1000,
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5
};

interface PseudointellectualPost {
  threadId: string;
  postId: number;
  content: string;
  timestamp: number;
}

interface ExtendedArticleStats extends ArticleStats {
  examples?: PseudointellectualPost[];
}

export class ArticleGenerator {
  private client: DeepSeekClient;
  private outputPath: string;

  constructor(apiKey: string) {
    this.client = new DeepSeekClient(apiKey);
    this.outputPath = path.resolve(paths.dataDir, 'articles');
  }

  private async loadExistingArticle(threadId: string): Promise<ArticleAnalysis | null> {
    try {
      const filePath = path.resolve(this.outputPath, `${threadId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async saveArticle(article: ArticleAnalysis) {
    const filePath = path.resolve(this.outputPath, `${article.threadId}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(article, null, 2), 'utf-8');
  }

  private async generateArticle(threadId: string, posts: string[], config: ArticleGeneratorConfig): Promise<ArticleAnalysis> {
    console.log(`Generating article for thread ${threadId}...`);
    
    const response = await this.client.chat({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert journalist summarizing online discussions.
Your task is to analyze a thread of posts and generate:
1. A clear, concise headline of 4 to 6 words.
2. A detailed article summarizing the key points and themes (100 - 150 words).

Focus on identifying pseudointellectual thought patterns, book recommendations, and other topics and events.
Maintain a neutral, academic tone.
Always directly quote comments verbatim in quotation marks.
Be sure to include lots of quotes.
Never contextualize the content with words like "online" or "forum". Never mention the discussion itself, only what was discussed.
Be sure that your headline and article are within the word limits.
Format your response as:
HEADLINE: [your headline]
ARTICLE: [your article]`
        },
        {
          role: 'user',
          content: `Analyze and summarize this thread:\n\n${posts.join('\n\n')}`
        }
      ],
      ...config
    });

    const content = response.choices[0].message.content;
    const headline = content.match(/HEADLINE: (.*)/)?.[1] || 'Untitled Thread';
    const article = content.match(/ARTICLE: ([\s\S]*)/)?.[1]?.trim() || 'No content generated';

    return {
      threadId,
      headline,
      article,
      delusionalStats: await this.analyzeDelusionalContent(threadId, posts),
      generatedAt: Date.now()
    };
  }

  private async analyzeDelusionalContent(threadId: string, posts: string[]): Promise<ExtendedArticleStats> {
    console.log('Analyzing posts for pseudointellectual content...');
    
    const response = await this.client.chat({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert psychiatrist analyzing online discussions.
Your task is to identify posts that exhibit signs of pseudointellectual thinking.
Common indicators include:
- Using jargon and complex language
- Lack of genuine knowledge
- Pretending to be an expert
- Repeating ideas without understanding
- Lack of curiosity

For each post, determine if it shows clear signs of pseudointellectual content. Be liberal with your interpretation.
Maintain strict clinical objectivity.
Return a JSON object with:
1. count: number of posts with pseudointellectual content
2. examples: array of up to 2 example posts that best demonstrate pseudointellectual thinking
Format: {"count": number, "examples": ["post1", "post2"]}`
        },
        {
          role: 'user',
          content: `Analyze these ${posts.length} posts for pseudointellectual content:\n\n${posts.join('\n\n')}`
        }
      ],
      temperature: 0.3
    });

    let result;
    try {
      let content = response.choices[0].message.content;
      
      // Handle markdown code blocks
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }
      
      result = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response');
      result = { count: 0, examples: [] };
    }

    const delusionalCount = result.count || 0;
    const examples = result.examples || [];
    
    // Save examples to pseuds.json
    if (examples.length > 0) {
      const pseudsPath = path.resolve(paths.dataDir, 'pseuds.json');
      try {
        let existingData: PseudointellectualPost[] = [];
        try {
          const fileContent = await fs.readFile(pseudsPath, 'utf-8');
          existingData = JSON.parse(fileContent);
        } catch {
          // File doesn't exist or is invalid, start fresh
        }

        // Add new examples with metadata
        const newExamples: PseudointellectualPost[] = examples.map((content: string) => {
          // Find the post with this content in the thread
          const post = posts.find(p => p.includes(content));
          // Extract post number from the post content using regex
          const postNoMatch = post?.match(/No\.\s*(\d+)/);
          const postNo = postNoMatch ? parseInt(postNoMatch[1]) : Date.now();
          
          return {
            threadId: threadId || `thread-${Date.now()}`,
            postId: postNo,
            content,
            timestamp: Date.now()
          };
        });

        // Data retention logic
        const MAX_EXAMPLES = 100; // Maximum number of examples to keep
        const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const now = Date.now();

        // 1. Remove duplicates based on content
        const uniqueExisting = existingData.filter((post, index, self) =>
          index === self.findIndex((p) => p.content === post.content)
        );

        // 2. Remove old examples
        const recentExisting = uniqueExisting.filter(
          (post) => now - post.timestamp < MAX_AGE_MS
        );

        // 3. Combine with new examples and limit total
        const updatedData = [...newExamples, ...recentExisting]
          .slice(0, MAX_EXAMPLES)
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

        // 4. Check file size and trim if needed
        const jsonString = JSON.stringify(updatedData, null, 2);
        const MAX_FILE_SIZE = 1024 * 1024; // 1MB

        if (jsonString.length > MAX_FILE_SIZE) {
          // If file is too large, keep only the most recent examples that fit
          let trimmedData = updatedData;
          while (JSON.stringify(trimmedData, null, 2).length > MAX_FILE_SIZE && trimmedData.length > 0) {
            trimmedData = trimmedData.slice(0, -1);
          }
          await fs.writeFile(pseudsPath, JSON.stringify(trimmedData, null, 2));
        } else {
          await fs.writeFile(pseudsPath, jsonString);
        }
      } catch {
        console.error('Failed to save pseudointellectual examples');
      }
    }
    
    return {
      analyzedComments: posts.length,
      delusionalComments: delusionalCount,
      percentage: (delusionalCount / posts.length) * 100,
      examples: examples.map((content: string, index: number) => ({
        threadId: threadId || `thread-${Date.now()}-${index}`,
        postId: index,
        content,
        timestamp: Date.now()
      }))
    };
  }

  async generate(threadId: string, posts: string[], options: ArticleGeneratorOptions = {}): Promise<ArticleAnalysis> {
    console.log(`Processing thread ${threadId}...`);
    
    // Check for existing article unless force regenerate is true
    if (!options.forceRegenerate) {
      const existing = await this.loadExistingArticle(threadId);
      if (existing) {
        console.log(`Found existing article for thread ${threadId}`);
        return existing;
      }
    }

    const config = { ...DEFAULT_CONFIG, ...options.config };
    const article = await this.generateArticle(threadId, posts, config);
    await this.saveArticle(article);
    
    return article;
  }
} 