'use client';

import React, { useEffect, useState } from 'react';
import StagePost from './StagePost';

interface PseudPost {
  threadId: string;
  postId: number;
  content: string;
  timestamp: number;
}

export default function PseudsCard() {
  const [data, setData] = useState<PseudPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [randomPosts, setRandomPosts] = useState<PseudPost[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/pseuds');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        if (!Array.isArray(jsonData)) {
          throw new Error('Invalid data format: expected an array of posts');
        }
        setData(jsonData);
        
        // Select up to 3 random posts
        const shuffled = [...jsonData].sort(() => 0.5 - Math.random());
        setRandomPosts(shuffled.slice(0, 3));
      } catch (error) {
        console.error('Error fetching pseuds data:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Unsubstantiated Claims to Knowledge</h2>
        <div style={{ 
          color: '#d32f2f',
          padding: '1rem',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          marginTop: '1rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Error Loading Data</div>
          <div>{error}</div>
          <div style={{ 
            fontSize: '0.875rem',
            color: '#666',
            marginTop: '0.5rem'
          }}>
            The data will automatically refresh when available.
          </div>
        </div>
      </div>
    );
  }

  if (!data || randomPosts.length === 0) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Unsubstantiated Claims to Knowledge</h2>
        <div style={{ 
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div className="loading-spinner" style={{
            width: '20px',
            height: '20px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #666',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Loading pseudointellectual posts...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Unsubstantiated Claims to Knowledge</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {randomPosts.map((post, index) => {
          // Convert numeric threadId if it's a string number, otherwise use 0
          const numericThreadId = !isNaN(parseInt(post.threadId)) ? parseInt(post.threadId) : 0;
          
          return (
            <StagePost 
              key={`${post.threadId}-${post.postId}-${post.timestamp}-${index}`}
              post={{
                postNumber: post.postId.toString(),
                comment: post.content,
                checkCount: 0,
                getType: 'Pseudointellectual Post',
                threadId: numericThreadId,
                time: Math.floor(post.timestamp / 1000),
                no: post.postId
              }} 
              position={index === 0 ? 'top' : index === randomPosts.length - 1 ? 'bottom' : 'middle'} 
              cardType="pseuds"
              customStyles={{
                background: '#006B3D', // Match the green background
                textColor: '#FFFFFF', // High contrast white text
                linkColor: '#00FF9D', // Bright green for links/post numbers
                quoteColor: '#FFA500' // Orange for greentext
              }}
            />
          );
        })}
      </div>
    </div>
  );
} 