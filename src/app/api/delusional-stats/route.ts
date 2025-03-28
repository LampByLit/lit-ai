import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { paths } from '@/app/utils/paths';

interface DelusionalStats {
  level: 'low' | 'medium' | 'high' | 'extreme';
  percentage: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    amount: number;
  };
}

function determineLevel(percentage: number): DelusionalStats['level'] {
  if (percentage >= 30) return 'extreme';
  if (percentage >= 20) return 'high';
  if (percentage >= 10) return 'medium';
  return 'low';
}

function calculateTrend(currentPercentage: number, previousPercentages: number[]) {
  if (previousPercentages.length === 0) {
    return { direction: 'stable' as const, amount: 0 };
  }

  const avgPrevious = previousPercentages.reduce((a, b) => a + b, 0) / previousPercentages.length;
  const difference = currentPercentage - avgPrevious;
  const direction = difference > 1 ? 'up' : difference < -1 ? 'down' : 'stable';

  return {
    direction,
    amount: Math.abs(difference)
  };
}

export async function GET() {
  try {
    console.log('=== Delusional Stats API Debug Info ===');

    // Load the latest analysis file
    const latestAnalysisPath = path.resolve(paths.dataDir, 'analysis', 'latest-delusional.json');
    const latestAnalysisExists = await fs.access(latestAnalysisPath)
      .then(() => true)
      .catch(() => false);

    if (!latestAnalysisExists) {
      console.log('No latest analysis file found');
      return NextResponse.json({ error: 'No analysis data available' }, { status: 404 });
    }

    // Load historical trends
    const trendsPath = path.resolve(paths.dataDir, 'analysis', 'delusional-trends.json');
    const trendsExist = await fs.access(trendsPath)
      .then(() => true)
      .catch(() => false);

    let previousPercentages: number[] = [];
    if (trendsExist) {
      const trendsData = await fs.readFile(trendsPath, 'utf-8');
      const trends = JSON.parse(trendsData);
      previousPercentages = trends
        .slice(-6) // Get last 6 entries
        .map((t: any) => t.percentage);
    }

    // Load and parse the latest analysis
    const latestAnalysisData = await fs.readFile(latestAnalysisPath, 'utf-8');
    const latestAnalysis = JSON.parse(latestAnalysisData);

    // Calculate current percentage
    const { analyzedComments = 0, delusionalComments = 0 } = latestAnalysis.statistics || {};
    const currentPercentage = analyzedComments > 0 
      ? (delusionalComments / analyzedComments) * 100 
      : 0;

    // Calculate trend
    const trend = calculateTrend(currentPercentage, previousPercentages);

    // Determine level based on percentage
    const level = determineLevel(currentPercentage);

    // Prepare response
    const stats: DelusionalStats = {
      level,
      percentage: currentPercentage,
      trend: {
        direction: trend.direction as DelusionalStats['trend']['direction'],
        amount: trend.amount
      }
    };

    console.log('Returning stats:', stats);
    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching delusional stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delusional statistics' },
      { status: 500 }
    );
  }
} 