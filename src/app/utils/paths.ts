/**
 * Centralized path management for the application
 * 
 * This utility ensures consistent path handling across all environments
 * (local development, production, Railway deployment)
 */

import path from 'path';
import { ensureDir } from './fs';
import { isRailway, getDataDir } from './env';

// Debug logging function
function logPathInfo(label: string, value: string) {
  console.log(`[PATHS] ${label}: ${value}`);
}

// Get the data directory from environment
const DATA_DIR = getDataDir();

// Log environment information
logPathInfo('Environment', isRailway() ? 'Railway' : 'Local');
logPathInfo('Project Root', process.cwd());
logPathInfo('Process CWD', process.cwd());
logPathInfo('__dirname', __dirname);
logPathInfo('Data Directory', DATA_DIR);

// Define all application paths
export const paths = {
  // Base data directory
  dataDir: DATA_DIR,
  
  // Thread data storage
  threadsDir: path.resolve(DATA_DIR, 'threads'),
  
  // Summary data storage
  summariesDir: path.resolve(DATA_DIR, 'summaries'),
  
  // Analysis data storage
  analysisDir: path.resolve(DATA_DIR, 'analysis'),
  
  // Analysis specific paths
  bigPicturePath: path.resolve(DATA_DIR, 'analysis', 'big-picture.json'),
  trendsPath: path.resolve(DATA_DIR, 'analysis', 'antisemitism-trends.json'),

  // Media storage
  mediaDir: path.resolve(DATA_DIR, 'media'),
  mediaOpDir: path.resolve(DATA_DIR, 'media', 'OP'),
  
  // X poster storage
  xposterDir: path.resolve(DATA_DIR, 'xposter'),
  
  // Helper to get thread file path by ID
  threadFile: (threadId: string) => path.resolve(DATA_DIR, 'threads', `${threadId}.json`),
  
  // Helper to get summary file path by ID
  summaryFile: (threadId: string) => path.resolve(DATA_DIR, 'summaries', `${threadId}.json`),
  
  // Helper to get analyzer results file path
  analyzerResultsFile: (analyzer: string) => path.resolve(DATA_DIR, 'analysis', analyzer, 'results.json')
} as const;

// Add type definition for paths
export type Paths = {
  dataDir: string;
  threadsDir: string;
  summariesDir: string;
  analysisDir: string;
  bigPicturePath: string;
  trendsPath: string;
  mediaDir: string;
  mediaOpDir: string;
  xposterDir: string;
  threadFile: (threadId: string) => string;
  summaryFile: (threadId: string) => string;
  analyzerResultsFile: (analyzer: string) => string;
};

// Ensure paths matches the type definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: Paths = paths;

/**
 * Ensures all required directories exist
 * This should be called during application startup
 */
export async function ensureDirectories(): Promise<void> {
  try {
    // Create base directories
    const directories = [
      paths.dataDir,
      paths.threadsDir,
      paths.summariesDir,
      paths.analysisDir,
      paths.xposterDir,
      path.resolve(paths.analysisDir, 'get'),
      path.resolve(paths.analysisDir, 'reply'),
      path.resolve(paths.analysisDir, 'link'),
      path.resolve(paths.analysisDir, 'geo'),
      path.resolve(paths.analysisDir, 'slur'),
      path.resolve(paths.analysisDir, 'media'),
    ];

    // Create all directories in parallel
    await Promise.all(directories.map(dir => ensureDir(dir)));
    
    console.log('All required directories have been created and verified');
  } catch (error) {
    console.error('Error ensuring directories exist:', error);
    // Don't throw - let the application continue and handle errors at higher levels
  }
}

/**
 * Validates write permissions for all data directories
 * Returns true if all directories are writable
 */
export async function validateDirectories(): Promise<boolean> {
  try {
    // Check if directories exist and are writable
    const directories = [
      paths.dataDir,
      paths.threadsDir, 
      paths.summariesDir,
      paths.analysisDir
    ];

    // Validate all directories in parallel
    await Promise.all(directories.map(dir => ensureDir(dir)));
    
    return true;
  } catch (error) {
    console.error('Directory validation failed:', error);
    return false;
  }
} 