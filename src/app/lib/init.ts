import { mkdir } from 'fs/promises';
import { getDataDir } from '../utils/env';
import { resolve } from 'path';

let initialized = false;

/**
 * Creates required directories if they don't exist
 */
async function createDirectories() {
  const dataDir = getDataDir();
  
  const requiredDirs = [
    dataDir,
    resolve(dataDir, 'threads'),
    resolve(dataDir, 'summaries'),
    resolve(dataDir, 'analysis')
  ];

  for (const dir of requiredDirs) {
    try {
      await mkdir(dir, { recursive: true });
      console.log(`✓ Ensured directory exists: ${dir}`);
    } catch (error) {
      if (error instanceof Error) {
        // EEXIST error means directory already exists - that's fine
        if ((error as any).code !== 'EEXIST') {
          throw new Error(`Failed to create directory ${dir}: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
}

/**
 * Initializes the application
 * This is idempotent - can be called multiple times safely
 */
export async function initialize() {
  if (initialized) {
    return { success: true, message: 'Already initialized' };
  }
  
  try {
    console.log('Starting application initialization...');
    await createDirectories();
    initialized = true;
    console.log('Application initialized successfully');
    return { success: true, message: 'Initialization complete' };
  } catch (error) {
    console.error('Failed to initialize application:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown initialization error'
    };
  }
} 