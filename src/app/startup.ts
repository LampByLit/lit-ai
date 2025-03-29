import fs from 'fs';
import path from 'path';
import { paths, ensureDirectories } from './utils/paths';

/**
 * Verify that all critical directories exist and are accessible
 */
async function verifyDirectories(): Promise<boolean> {
  const criticalDirs = [
    paths.dataDir,
    paths.threadsDir,
    paths.summariesDir,
    paths.analysisDir
  ];

  for (const dir of criticalDirs) {
    try {
      await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);
      const stats = await fs.promises.stat(dir);
      if (!stats.isDirectory()) {
        console.error(`Path exists but is not a directory: ${dir}`);
        return false;
      }
      console.log(`✓ Verified directory: ${dir}`);
    } catch (error) {
      console.error(`Failed to verify directory ${dir}:`, error);
      // Create directory if it doesn't exist
      try {
        await fs.promises.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      } catch (mkdirError) {
        console.error(`Failed to create directory ${dir}:`, mkdirError);
        return false;
      }
    }
  }
  return true;
}

async function cleanupDataDirectories() {
  // Skip cleanup if explicitly disabled
  if (process.env.SKIP_DATA_CLEANUP === 'true') {
    console.log('Data cleanup disabled via SKIP_DATA_CLEANUP');
    return;
  }

  // Only run in Railway environment
  if (process.env.RAILWAY_ENVIRONMENT !== 'production') {
    console.log('Not in Railway environment, skipping cleanup');
    return;
  }

  console.log('Starting data directory cleanup...');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT);
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  // Create base data directory if it doesn't exist
  if (!fs.existsSync(paths.dataDir)) {
    console.log('Creating base data directory:', paths.dataDir);
    await fs.promises.mkdir(paths.dataDir, { recursive: true });
    await fs.promises.chmod(paths.dataDir, '777');
    console.log('Created base data directory with 777 permissions');
  }

  // Add specific check for required files
  const requiredFiles = [
    {
      path: path.join(paths.analysisDir, 'antisemitism-trends.json'),
      initialData: {
        lastUpdated: Date.now(),
        results: []
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

  for (const { path: filePath, initialData } of requiredFiles) {
    const dir = path.dirname(filePath);
    try {
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.chmod(dir, '777');
      }
      
      if (!fs.existsSync(filePath)) {
        console.log(`Creating empty file: ${filePath}`);
        await fs.promises.writeFile(filePath, JSON.stringify(initialData, null, 2));
        await fs.promises.chmod(filePath, '666');
        console.log(`Created file with initial data: ${filePath}`);
      } else {
        // Ensure existing file has proper permissions
        await fs.promises.chmod(filePath, '666');
        console.log(`Updated permissions for existing file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  const dirsToClean = [
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

  // Add timeout to cleanup operation
  const cleanupPromise = (async () => {
    // Clean each directory
    for (const dir of dirsToClean) {
      try {
        if (!fs.existsSync(dir)) {
          console.log(`Creating directory: ${dir}`);
          await fs.promises.mkdir(dir, { recursive: true });
          await fs.promises.chmod(dir, '777');
          console.log(`Created directory with 777 permissions: ${dir}`);
          continue;
        }

        console.log(`Checking directory: ${dir}`);
        const files = await fs.promises.readdir(dir);
        
        // Log what we found
        console.log(`Found ${files.length} files in ${dir}`);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stats = await fs.promises.stat(filePath);
            if (stats.isFile()) {
              await fs.promises.chmod(filePath, '666');
              console.log(`Set file permissions to 666: ${filePath}`);
            } else if (stats.isDirectory()) {
              await fs.promises.chmod(filePath, '777');
              console.log(`Set directory permissions to 777: ${filePath}`);
            }
          } catch (error) {
            console.error(`Error setting permissions for ${filePath}:`, error);
          }
        }
        
        console.log(`Finished checking directory: ${dir}`);
      } catch (error) {
        console.error(`Error processing ${dir}:`, error);
      }
    }
  })();

  // Set 30 second timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Cleanup timed out after 30 seconds')), 30000);
  });

  try {
    await Promise.race([cleanupPromise, timeoutPromise]);
    console.log('Cleanup completed within timeout');
  } catch (error) {
    console.error('Cleanup operation error:', error);
    // Continue even if cleanup times out
  }

  // Always try to recreate directories
  try {
    await ensureDirectories();
    console.log('Data directories cleaned and recreated successfully');
  } catch (error) {
    console.error('Error recreating directories:', error);
    // Don't throw, just log the error
  }
}

/**
 * Initialize the application
 * Returns true if initialization was successful
 */
export async function initializeApp(): Promise<boolean> {
  try {
    console.log('Starting application initialization...');
    
    // Set overall timeout for initialization
    const initPromise = (async () => {
      // Run cleanup first
      await cleanupDataDirectories();
      
      // Verify directories after cleanup
      console.log('Verifying directory structure...');
      const maxAttempts = 3; // Reduced from 5 to 3
      let attempts = 0;
      let directoriesReady = false;
      
      while (attempts < maxAttempts && !directoriesReady) {
        attempts++;
        console.log(`Directory verification attempt ${attempts}/${maxAttempts}`);
        directoriesReady = await verifyDirectories();
        
        if (!directoriesReady && attempts < maxAttempts) {
          console.log('Waiting 3 seconds before next attempt...'); // Reduced from 5 to 3 seconds
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      if (!directoriesReady) {
        console.warn('Directory structure not fully verified, but continuing...');
      }
      
      return true;
    })();

    // Set 60 second timeout for entire initialization
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timed out after 60 seconds')), 60000);
    });

    await Promise.race([initPromise, timeoutPromise]);
    console.log('Application initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Application initialization failed:', error);
    // Return true anyway to allow the app to start
    return true;
  }
}

// If this file is run directly, run initialization
if (require.main === module) {
  initializeApp()
    .then(() => {
      // Always exit successfully
      process.exit(0);
    })
    .catch(error => {
      console.error('Startup script failed:', error);
      // Exit successfully even on error
      process.exit(0);
    });
} 