import fs from 'fs/promises';
import path from 'path';
import { paths } from './paths';

/**
 * Cleans all data directories if SKIP_DATA_CLEANUP is not set
 * This should be called during application startup
 */
export async function cleanupDataOnStartup(): Promise<void> {
  // Check if we should skip cleanup
  if (process.env.SKIP_DATA_CLEANUP === 'true') {
    console.log('Skipping data cleanup due to SKIP_DATA_CLEANUP=true');
    return;
  }

  console.log('Starting data cleanup...');
  
  try {
    // List of directories to clean
    const directories = [
      paths.threadsDir,
      paths.summariesDir,
      paths.analysisDir,
      paths.mediaDir,
      paths.articlesDir
    ];

    // Clean each directory
    for (const dir of directories) {
      if (await directoryExists(dir)) {
        console.log(`Cleaning directory: ${dir}`);
        await cleanDirectory(dir);
      }
    }

    console.log('Data cleanup complete');
  } catch (error) {
    console.error('Error during data cleanup:', error);
    throw error;
  }
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean all files in a directory
 */
async function cleanDirectory(dirPath: string): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        // Recursively clean subdirectories
        await cleanDirectory(filePath);
        // Remove the empty directory
        await fs.rmdir(filePath);
      } else {
        // Remove the file
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error(`Error cleaning directory ${dirPath}:`, error);
    throw error;
  }
} 