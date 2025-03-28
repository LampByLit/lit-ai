import path from 'path';
import { Summarizer } from './Summarizer';
import cron from 'node-cron';
import { scrape } from './scraper';
import { loadAllThreads } from '../utils/fileLoader';
import { selectThreads } from '../utils/threadSelector';

async function runScraperJob() {
    await scrape();
}

async function runSummarizerJob() {
  const summarizer = new Summarizer(process.env.DEEPSEEK_API_KEY!);
  const allThreads = await loadAllThreads(path.resolve(process.cwd(), 'data', 'threads'));
    const selection = selectThreads(allThreads);
    const threadsToAnalyze = [
      ...selection.topByPosts,
      ...selection.mediumHighPosts,
      ...selection.mediumPosts,
      ...selection.lowPosts
    ];
  await summarizer.summarize(threadsToAnalyze);
}

export class Scheduler {
  private static instance: Scheduler | null = null;
  private scrapeJob: cron.ScheduledTask | null = null;
  private summarizeJob: cron.ScheduledTask | null = null;

  private constructor() {
    this.initializeJobs();
  }

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  private initializeJobs() {
    // Schedule jobs at specific times
    this.scrapeJob = cron.schedule('0 */2 * * *', runScraperJob, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.summarizeJob = cron.schedule('15 */2 * * *', runSummarizerJob, {
      scheduled: false,
      timezone: 'UTC'
    });
  }

  async start(): Promise<void> {
    try {
      this.scrapeJob?.start();
      this.summarizeJob?.start();
      console.log('Started all scheduled jobs');
    } catch (error) {
      console.error('Failed to start jobs:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.scrapeJob?.stop();
      this.summarizeJob?.stop();
      console.log('Stopped all scheduled jobs');
    } catch (error) {
      console.error('Failed to stop jobs:', error);
      throw error;
    }
  }

  async runScrapeManually() {
    console.log('Running scrape job manually');
    await runScraperJob();
  }

  async runSummarizeManually() {
    console.log('Running summarize job manually');
    await runSummarizerJob();
  }
}

// Remove the exported instance since we're using getInstance() now
// export const scheduler = new Scheduler(); 