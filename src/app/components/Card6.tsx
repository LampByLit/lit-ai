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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analysis/slur');
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
        const latestResult = Array.isArray(jsonData.results) ? jsonData.results[0] : null;
        if (!latestResult) throw new Error('No data available');
        setData(latestResult);
      } catch (error) {
        console.error('Error fetching meds data:', error);
        setError('Error loading data');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.loading}>Loading...</div>;
  
  if (!data.medsPosts || data.medsPosts.length === 0) {
    return (
      <>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Meds Prescribed</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          No meds posts found in recent threads
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