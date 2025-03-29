import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface InitialData {
  path: string;
  initialData: unknown;
}

const REQUIRED_FILES: InitialData[] = [
  {
    path: path.join(paths.analysisDir, 'antisemitism-trends.json'),
    initialData: {
      lastUpdated: Date.now(),
      results: []
    }
  },
  {
    path: path.join(paths.analysisDir, 'latest-delusional.json'),
    initialData: {
      statistics: {
        analyzedComments: 0,
        delusionalComments: 0,
        percentage: 0
      },
      generatedAt: Date.now()
    }
  },
  {
    path: path.join(paths.analysisDir, 'previous-delusional.json'),
    initialData: {
      statistics: {
        analyzedComments: 0,
        delusionalComments: 0,
        percentage: 0
      },
      generatedAt: Date.now() - 3600000 // 1 hour ago
    }
  },
  {
    path: path.join(paths.analysisDir, 'slur', 'results.json'),
    initialData: {
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
    }
  },
  {
    path: path.join(paths.analysisDir, 'get', 'results.json'),
    initialData: {
      lastUpdated: Date.now(),
      results: []
    }
  },
  {
    path: path.join(paths.analysisDir, 'reply', 'results.json'),
    initialData: {
      lastUpdated: Date.now(),
      results: []
    }
  },
  {
    path: path.join(paths.analysisDir, 'latest-thread.json'),
    initialData: {
      lastModified: Date.now(),
      threadId: null,
      content: null
    }
  },
  {
    path: path.join(paths.analysisDir, 'recent-tweets.json'),
    initialData: {
      tweets: [],
      lastUpdated: Date.now()
    }
  },
  {
    path: path.join(paths.articlesDir, 'latest-article.json'),
    initialData: {
      articles: [],
      lastUpdated: Date.now()
    }
  }
];

const REQUIRED_DIRS = [
  paths.dataDir,
  paths.analysisDir,
  paths.threadsDir,
  paths.summariesDir,
  paths.mediaDir,
  paths.mediaOpDir,
  path.join(paths.analysisDir, 'get'),
  path.join(paths.analysisDir, 'reply'),
  path.join(paths.analysisDir, 'link'),
  path.join(paths.analysisDir, 'geo'),
  path.join(paths.analysisDir, 'slur'),
  path.join(paths.analysisDir, 'media')
];

async function ensureDir(dir: string): Promise<void> {
  try {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.chmod(dir, '777');
    console.log(`Set directory permissions to 777: ${dir}`);
  } catch (error) {
    console.error(`Failed to ensure directory ${dir}:`, error);
    throw error;
  }
}

async function ensureFile(filePath: string, initialData: unknown): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await ensureDir(dir);

    if (!fs.existsSync(filePath)) {
      console.log(`Creating file: ${filePath}`);
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(initialData, null, 2)
      );
    }
    await fs.promises.chmod(filePath, '666');
    console.log(`Set file permissions to 666: ${filePath}`);

    // Validate file is readable and contains valid JSON
    const content = await fs.promises.readFile(filePath, 'utf-8');
    JSON.parse(content); // Will throw if invalid JSON
    console.log(`Validated file contents: ${filePath}`);
  } catch (error) {
    console.error(`Failed to ensure file ${filePath}:`, error);
    throw error;
  }
}

export async function initializeData(): Promise<void> {
  console.log('=== Initializing Data ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    // First ensure all directories exist
    console.log('\nCreating required directories...');
    for (const dir of REQUIRED_DIRS) {
      await ensureDir(dir);
    }

    // Then ensure all files exist with proper permissions
    console.log('\nCreating required files...');
    for (const { path: filePath, initialData } of REQUIRED_FILES) {
      await ensureFile(filePath, initialData);
    }

    console.log('\nData initialization completed successfully');
  } catch (error) {
    console.error('\nData initialization failed:', error);
    throw error;
  }
}

// Export for testing
export const __test__ = {
  REQUIRED_FILES,
  REQUIRED_DIRS,
  ensureDir,
  ensureFile
}; 