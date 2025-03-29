/**
 * Application startup and initialization
 * 
 * This module handles the initialization of the application,
 * ensuring all required data structures and files exist before
 * serving requests.
 */

import { initializeData } from './lib/init';

// Track initialization state
let initialized = false;

// Longer timeout for Railway production environment
const INIT_TIMEOUT = process.env.RAILWAY_ENVIRONMENT === 'production' ? 180000 : 60000; // 3 minutes in production, 1 minute locally

/**
 * Initialize the application
 * Returns true if initialization was successful
 * @throws Error if initialization fails or times out
 */
export async function initializeApp(): Promise<boolean> {
  // Skip if already initialized
  if (initialized) {
    console.log('Application already initialized');
    return true;
  }

  try {
    console.log('=== Starting Application Initialization ===');
    console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
    console.log('Timeout:', INIT_TIMEOUT, 'ms');
    console.log('CWD:', process.cwd());
    
    // Set overall timeout for initialization
    const initPromise = (async () => {
      try {
        // Initialize all required data
        await initializeData();
        initialized = true;
        console.log('Data initialization completed successfully');
        return true;
      } catch (error) {
        console.error('=== Data Initialization Error ===');
        console.error('Error:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        throw error;
      }
    })();

    // Set timeout based on environment
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(`Initialization timed out after ${INIT_TIMEOUT/1000} seconds`);
        console.error('=== Initialization Timeout ===');
        console.error(timeoutError);
        reject(timeoutError);
      }, INIT_TIMEOUT);
    });

    await Promise.race([initPromise, timeoutPromise]);
    console.log('Application initialization completed successfully');
    return true;
  } catch (error) {
    console.error('=== Application Initialization Failed ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Let the middleware handle the error
  }
}

// If this file is run directly, run initialization
if (require.main === module) {
  initializeApp()
    .then(() => {
      console.log('Startup script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Startup script failed:', error);
      process.exit(1); // Exit with error code
    });
} 