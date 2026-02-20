/**
 * Entry point: run full pipeline (scrape -> qualify -> enrich -> sync -> report).
 * Schedule this for every Monday 6 AM EST (e.g. cron: 0 6 * * 1).
 */
import { runPipeline } from './pipeline';

runPipeline()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
