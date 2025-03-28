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
  private scrapeJob: cron.ScheduledTask | null = null;
  private summarizeJob: cron.ScheduledTask | null = null;

  constructor() {
    this.initializeJobs();
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

  startJobs() {
    this.scrapeJob?.start();
    this.summarizeJob?.start();
    console.log('Started all scheduled jobs');
  }

  stopJobs() {
    this.scrapeJob?.stop();
    this.summarizeJob?.stop();
    console.log('Stopped all scheduled jobs');
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

export const scheduler = new Scheduler(); 