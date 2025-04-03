'use client';

import { useEffect, useState } from 'react';

interface DelusionalStats {
  level: 'low' | 'medium' | 'high' | 'extreme';
  percentage: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    amount: number;
  };
}

export const DelusionalStats = () => {
  const [stats, setStats] = useState<DelusionalStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/delusional-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left', color: '#171717' }}>Schizophrenia Per Post</h2>
        <div style={{ color: '#171717' }}>Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left', color: '#171717' }}>Schizophrenia Per Post</h2>
        <div style={{ color: '#171717' }}>{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left', color: '#171717' }}>Schizophrenia Per Post</h2>
        <div style={{ color: '#171717' }}>No stats available</div>
      </div>
    );
  }

  const { level, percentage, trend } = stats;
  const trendSymbol = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '↑';

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left', color: '#171717' }}>Schizophrenia Per Post</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '4rem', lineHeight: '1', fontWeight: 'bold', color: '#171717', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            {percentage.toFixed(1)}%
            <span style={{ fontSize: '1rem', color: '#171717' }}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', color: '#171717', fontWeight: '500' }}>
          {trendSymbol} {trend.amount.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}; 