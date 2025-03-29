'use client';

import { useEffect, useState } from 'react';
import styles from './ArticleCard.module.css';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/delusional-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        
        // Always set default values if data is invalid
        const defaultStats = {
          level: 'low' as const,
          percentage: 0,
          trend: {
            direction: 'stable' as const,
            amount: 0
          }
        };
        
        // Validate the data structure
        if (data && 
            typeof data.percentage === 'number' && 
            typeof data.level === 'string' && 
            data.trend && 
            typeof data.trend.direction === 'string' && 
            typeof data.trend.amount === 'number') {
          setStats(data);
        } else {
          console.warn('Invalid stats data received:', data);
          setStats(defaultStats);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStats({
          level: 'low',
          percentage: 0,
          trend: {
            direction: 'stable',
            amount: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 10 minutes
    const interval = setInterval(fetchStats, 600000);
    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={styles.statsContainer}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>
          Schizophrenia Per Post
        </h2>
        <div className={styles.loading}>Analyzing posts...</div>
      </div>
    );
  }

  // Always use displayStats to ensure we have valid data
  const displayStats = stats || {
    level: 'low',
    percentage: 0,
    trend: {
      direction: 'stable',
      amount: 0
    }
  };

  const { level, percentage, trend } = displayStats;
  const trendSymbol = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '↑';
  const trendColor = trend.direction === 'up' ? '#ff4444' : trend.direction === 'down' ? '#44ff44' : '#ffffff';

  return (
    <div className={styles.statsContainer}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>
        Schizophrenia Per Post
      </h2>
      <div className={styles.statsContent}>
        <div className={styles.mainStat}>
          <div style={{ fontSize: '4rem', lineHeight: '1', fontWeight: 'bold' }}>
            {percentage.toFixed(1)}% <span style={{ fontSize: '1rem' }}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
          </div>
        </div>
        <div className={styles.trendStat} style={{ color: trendColor }}>
          {trendSymbol} {trend.amount.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}; 