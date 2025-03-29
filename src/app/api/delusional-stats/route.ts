import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { paths } from '@/app/utils/paths';

interface DelusionalStats {
  statistics: {
    analyzedComments: number;
    delusionalComments: number;
    percentage: number;
  };
  generatedAt: number;
}

type TrendDirection = 'up' | 'down' | 'stable';

interface TrendInfo {
  direction: TrendDirection;
  amount: number;
}

// Default stats to return when no data is available
const DEFAULT_STATS = {
  level: 'low' as const,
  percentage: 0,
  trend: {
    direction: 'stable' as TrendDirection,
    amount: 0
  }
};

export async function GET() {
  try {
    const statsPath = path.resolve(paths.dataDir, 'analysis', 'latest-delusional.json');
    
    // Check if file exists
    try {
      await fs.access(statsPath);
    } catch {
      console.log('Stats file not found, returning defaults');
      return NextResponse.json(DEFAULT_STATS);
    }

    // Read current stats
    const currentStatsRaw = await fs.readFile(statsPath, 'utf-8');
    const currentStats: DelusionalStats = JSON.parse(currentStatsRaw);

    // Validate current stats
    if (!currentStats?.statistics?.percentage) {
      console.log('Invalid stats data in file, returning defaults');
      return NextResponse.json(DEFAULT_STATS);
    }

    // Read previous stats if they exist
    const previousStatsPath = path.resolve(paths.dataDir, 'analysis', 'previous-delusional.json');
    let previousStats: DelusionalStats | null = null;
    
    try {
      const previousStatsRaw = await fs.readFile(previousStatsPath, 'utf-8');
      previousStats = JSON.parse(previousStatsRaw);
    } catch {
      console.log('No previous stats found');
    }

    // Calculate trend with proper validation
    const trend: TrendInfo = {
      direction: 'stable',
      amount: 0
    };

    if (previousStats?.statistics?.percentage != null) {
      const diff = currentStats.statistics.percentage - previousStats.statistics.percentage;
      trend.direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      trend.amount = Math.abs(diff);
    }

    // Determine level based on percentage with validation
    const percentage = currentStats.statistics.percentage || 0;
    let level: 'low' | 'medium' | 'high' | 'extreme';

    if (percentage < 25) {
      level = 'low';
    } else if (percentage < 50) {
      level = 'medium';
    } else if (percentage < 75) {
      level = 'high';
    } else {
      level = 'extreme';
    }

    const response = {
      level,
      percentage,
      trend
    };

    console.log('Returning stats:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in delusional-stats route:', error);
    return NextResponse.json(DEFAULT_STATS);
  }
} 