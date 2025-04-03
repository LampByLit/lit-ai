'use client';

import React, { useEffect, useState } from 'react';
import styles from './Card6.module.css';
import StagePost from './StagePost';

// Interface matching the API response and StagePost requirements
interface GreeksPost {
  // Required fields from API
  no: number;
  time: number;
  name: string;
  com: string;
  replies: number;
  threadId: number;
  // Required fields for StagePost
  postNumber: string;
  comment: string;
  checkCount: number;
  getType: string;
  // Optional fields
  hasImage?: boolean;
  filename?: string;
  ext?: string;
  tim?: number;
  sub?: string;
  resto?: number;
}

export default function Card6() {
  const [data, setData] = useState<GreeksPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/greeks');
        if (!response.ok) {
          throw new Error('Failed to fetch greeks data');
        }
        const jsonData = await response.json();
        if (!Array.isArray(jsonData)) {
          throw new Error('Invalid data format');
        }
        // Transform the data to include required fields
        const transformedData = jsonData.map(post => ({
          ...post,
          postNumber: post.no.toString(),
          comment: post.com,
          checkCount: post.replies,
          getType: 'Greeks Post'
        }));
        setData(transformedData);
      } catch (error) {
        console.error('Error fetching greeks data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Greeks Recommended</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#666',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px dashed #444'
        }}>
          <p style={{ marginBottom: '1rem' }}>Error Loading Data</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {error}
          </p>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Greeks Recommended</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#666',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px dashed #444'
        }}>
          <p style={{ marginBottom: '1rem' }}>Loading...</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            Fetching greek-related recommendations...
          </p>
        </div>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Greeks Recommended</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#666',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px dashed #444'
        }}>
          <p style={{ marginBottom: '1rem' }}>No Recommendations Found</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            No greek-related recommendations in recent threads
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Greeks Recommended</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {data.map((post, index) => (
          <StagePost 
            key={post.no} 
            post={post} 
            position={index === 0 ? 'top' : index === data.length - 1 ? 'bottom' : 'middle'} 
            cardType="greeks" 
          />
        ))}
      </div>
    </>
  );
} 