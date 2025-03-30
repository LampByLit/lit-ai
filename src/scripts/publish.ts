import fs from 'fs/promises';
import path from 'path';
import { paths, ensureDirectories } from '../app/lib/utils/paths';

interface PublicData {
  significantGets: {
    postNumber: string;
    comment: string;
    checkCount: number;
    getType: string;
    hasImage?: boolean;
  }[];
  keyInsights: {
    postNumber: string;
    comment: string;
    replies: number;
  }[];
  updatedAt: number;
}

async function loadSignificantGets() {
  try {
    const filePath = paths.analyzerResultsFile('get');
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid data structure in gets results');
      return [];
    }

    return data.results
      .sort((a: any, b: any) => {
        const checkDiff = b.metadata.checkCount - a.metadata.checkCount;
        if (checkDiff !== 0) return checkDiff;
        return b.digitCount - a.digitCount;
      })
      .slice(0, 3)
      .map((result: any) => ({
        postNumber: result.metadata.postNo.toString(),
        comment: result.metadata.comment,
        checkCount: result.metadata.checkCount,
        getType: result.getType,
        hasImage: result.metadata.hasImage
      }));
  } catch (error) {
    console.error('Error loading significant GETs:', error);
    return [];
  }
}

async function loadKeyInsights() {
  try {
    const response = await fetch('http://localhost:3000/api/reply');
    if (!response.ok) {
      throw new Error('Failed to fetch reply data');
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid reply data structure');
    }

    return data.slice(0, 3).map((post: any) => ({
      postNumber: post.no.toString(),
      comment: post.com || '',
      replies: post.replies || 0
    }));
  } catch (error) {
    console.error('Error loading key insights:', error);
    return [];
  }
}

async function publishData() {
  try {
    console.log('Starting data publication process...');
    
    // Ensure directories exist
    await ensureDirectories();
    
    // Create public directory if it doesn't exist
    const publicDir = path.resolve(process.cwd(), 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    // Load data
    console.log('Loading significant GETs...');
    const gets = await loadSignificantGets();
    console.log(`Loaded ${gets.length} significant GETs`);
    
    console.log('Loading key insights...');
    const insights = await loadKeyInsights();
    console.log(`Loaded ${insights.length} key insights`);
    
    // Prepare public data
    const publicData: PublicData = {
      significantGets: gets,
      keyInsights: insights,
      updatedAt: Date.now()
    };
    
    // Save to public directory
    const publicPath = path.resolve(publicDir, 'data.json');
    await fs.writeFile(publicPath, JSON.stringify(publicData, null, 2), 'utf-8');
    console.log('Data published successfully to:', publicPath);
    
    return true;
  } catch (error) {
    console.error('Failed to publish data:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  publishData()
    .then(success => {
      if (success) {
        console.log('Publication completed successfully');
        process.exit(0);
      } else {
        console.error('Publication failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error during publication:', error);
      process.exit(1);
    });
}

export { publishData }; 