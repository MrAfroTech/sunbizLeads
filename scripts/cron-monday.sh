#!/usr/bin/env sh
# Run every Monday at 6:00 AM Eastern (adjust for your server timezone)
# Add to crontab: 0 6 * * 1 /path/to/florida-sunbiz-scraper/scripts/cron-monday.sh

cd "$(dirname "$0")/.."
export TZ=America/New_York
npm run pipeline 2>&1 | tee -a logs/pipeline.log
