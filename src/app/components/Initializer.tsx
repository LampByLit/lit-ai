'use client';

import { useEffect, useState } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function Initializer() {
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init', {
          // Add cache busting to prevent stale responses
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error('Initialization failed');
        }

        console.log('Initialization successful');
      } catch (error) {
        console.error('Initialization error:', error);
        
        // Retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying initialization (${retryCount + 1}/${MAX_RETRIES})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, RETRY_DELAY);
        } else {
          console.error('Max retries reached. Initialization failed.');
        }
      }
    };
    
    init();
  }, [retryCount]); // Re-run when retryCount changes
  
  return null;
} 