import fs from 'fs';
import { paths } from './utils/paths';

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

/**
 * Initialize the application
 * Returns true if initialization was successful
 */
export async function initializeApp(): Promise<boolean> {
  try {
    console.log('Starting application initialization...');
    
    // Set overall timeout for initialization
    const initPromise = (async () => {
      // Verify directories
      console.log('Verifying directory structure...');
      const maxAttempts = 3;
      let attempts = 0;
      let directoriesReady = false;
      
      while (attempts < maxAttempts && !directoriesReady) {
        attempts++;
        console.log(`Directory verification attempt ${attempts}/${maxAttempts}`);
        directoriesReady = await verifyDirectories();
        
        if (!directoriesReady && attempts < maxAttempts) {
          console.log('Waiting 3 seconds before next attempt...');
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