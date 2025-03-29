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
    console.log('Starting application initialization...');
    
    // Set overall timeout for initialization
    const initPromise = (async () => {
      // Initialize all required data
      await initializeData();
      initialized = true;
      return true;
    })();

    // Set 60 second timeout for entire initialization
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timed out after 60 seconds')), 60000);
    });

    await Promise.race([initPromise, timeoutPromise]);
    console.log('Application initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Application initialization failed:', error);
    throw error; // Let the app crash if initialization fails
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