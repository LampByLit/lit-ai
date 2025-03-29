'use client';

import React, { useEffect, useState } from 'react';
import styles from './Card6.module.css';
import StagePost from './StagePost';

interface MedsPost {
  postId: number;
  threadId: number;
  comment: string;
  timestamp: number;
  name: string;
}

interface SlurAnalyzerResult {
  medsPosts: MedsPost[];
  metadata: {
    totalPostsAnalyzed: number;
    postsWithMeds: number;
    lastAnalysis: number;
  };
}

export default function Card6() {
  const [data, setData] = useState<SlurAnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching meds data...');
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/meds');
        
        if (!response.ok) {
          console.error('Failed to fetch meds data:', response.status, response.statusText);
          throw new Error('Failed to fetch data');
        }
        
        const jsonData = await response.json();
        console.log('Received meds data:', jsonData);
        
        // Handle empty array case
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          setData(null);
          return;
        }
        
        setData({
          medsPosts: jsonData,
          metadata: {
            totalPostsAnalyzed: 0,
            postsWithMeds: jsonData.length,
            lastAnalysis: Date.now()
          }
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching meds data:', error);
        setError('Error loading data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Meds Prescribed</h2>
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
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (error || !data || !data.medsPosts || data.medsPosts.length === 0) {
    return (
      <>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Meds Prescribed</h2>
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
          <p style={{ marginBottom: '1rem' }}>No Prescriptions Found</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            No medication-related posts in recent threads
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Meds Prescribed</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <StagePost position="top" cardType="meds" />
        <StagePost position="middle" cardType="meds" />
        <StagePost position="bottom" cardType="meds" />
      </div>
    </>
  );
} 