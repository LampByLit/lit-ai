'use client';

import React, { useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';

const RecentXPosts = () => {
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTweetId = async () => {
      try {
        const response = await fetch('/api/recent-tweets');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch tweet');
        }
        
        setTweetId(data.tweets[0] || null);
        setError(null);
      } catch (err) {
        console.error('Error fetching tweet ID:', err);
        setError('Unable to load recent post');
      } finally {
        setLoading(false);
      }
    };

    fetchTweetId();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTweetId, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        background: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        color: 'white'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem',
          color: '#1DA1F2'
        }}>
          Loading latest post...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        background: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        color: 'white'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem',
          color: '#ff4444'
        }}>
          {error}
        </h2>
      </div>
    );
  }

  return (
    <div style={{
      background: '#333333',
      width: '100%',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #444'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem',
          color: 'white',
          margin: 0
        }}>
          X Bot
        </h2>
        <a 
          href="https://twitter.com/recapitul8r"
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: '#1DA1F2',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          View Profile
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"/>
          </svg>
        </a>
      </div>
      <div style={{ padding: '1rem' }}>
        {tweetId ? (
          <div style={{ 
            background: '#1a1a1a', 
            borderRadius: '8px',
            border: '1px solid #333',
            padding: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Tweet 
                id={tweetId} 
                onError={() => console.log(`Failed to load tweet ${tweetId}`)}
              />
            </div>
            <div style={{ 
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: '#888',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <a 
                href={`https://twitter.com/recapitul8r/status/${tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#1DA1F2', 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                View on Twitter
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"/>
                </svg>
              </a>
              <span style={{ color: '#666', fontSize: '0.75rem' }}>
                Posted by &amp X Bot
              </span>
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#888',
            padding: '2rem',
            border: '1px dashed #444',
            borderRadius: '8px',
            background: '#1a1a1a'
          }}>
            <p style={{ marginBottom: '1rem' }}>No recent post available</p>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Check back soon for new updates
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentXPosts; 