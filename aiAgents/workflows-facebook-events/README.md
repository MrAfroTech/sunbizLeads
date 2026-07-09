# Facebook Event Posting System - n8n Workflows

This directory contains automated workflows for discovering, creating, and managing Facebook events from Seamlessly event data.

## Workflow Overview

### Core Pipeline (Agents 1-6)
1. **01_event_discovery_seamlessly.json** - Discovers events from Seamlessly API and adds them to the pipeline
2. **02_event_content_generator.json** - Generates engaging Facebook event descriptions using AI
3. **03_facebook_event_creator.json** - Creates Facebook events via Graph API with image upload support
4. **04_facebook_page_poster.json** - Posts event announcements to Facebook Page feed
5. **05_event_reminder_scheduler.json** - Sends automated reminders (48h, 24h, 4h before event)
6. **06_cross_platform_sync.json** - Syncs events to Instagram and aggregates cross-platform analytics

### Production Support (Agents 7-9)
7. **07_post_event_analytics.json** - Analyzes event performance post-completion, calculates ROI, generates AI insights, and creates learning data
8. **08_failed_event_rescuer.json** - Automatic failure detection and recovery with smart retry strategies
9. **09_image_optimizer.json** - Generates AI images for events without visuals, optimizes existing images, provides fallbacks

## Google Sheets Structure

**Sheet Name:** "Facebook Events Pipeline"

**Columns:**
- A: event_id - Unique identifier from Seamlessly
- B: venue_name - Name of the venue hosting the event
- C: event_name - Name/title of the event
- D: event_date - Event date (YYYY-MM-DD format)
- E: event_time - Event start time (HH:MM format)
- F: description - Event description/details
- G: ticket_link - URL to purchase tickets
- H: facebook_event_id - Facebook Event ID after creation
- I: facebook_post_id - Facebook Post ID after posting
- J: posted_date - Timestamp when posted to Facebook
- K: rsvp_count - Total RSVPs (attending + interested)
- L: ticket_sales - Number of tickets sold (from Seamlessly)
- M: status - Current status (discovered, content_ready, event_created, posted, etc.)
- N: notes - Additional notes and timestamps

## Configuration

See `shared_config_facebook.json` for:
- Facebook Page credentials (Page Access Token, Page ID)
- Facebook Graph API version (v18.0)
- Seamlessly API endpoint configuration
- Posting schedule defaults:
  - advance_notice_days: 14 (post 2 weeks before event)
  - reminder_schedule: [48h, 24h, 4h before event]
  - optimal_post_times: [6pm weekdays, 11am weekends]
- Event categories: concert, sports, nightlife, food-festival, networking, other
- Image handling settings
- Multi-venue support configuration

## Features

### Error Handling
- Rate limit detection and automatic retry logic
- Error logging with detailed messages
- Graceful handling of missing data

### Image Support
- Automatic image download from event URLs
- Image upload to Facebook events
- Support for JPG, JPEG, PNG formats
- Optimal aspect ratio: 1.91:1 (1200x628 minimum)

### Multi-Venue Support
- Handles events with multiple venues
- Configurable venue separator
- Maximum 10 venues per event

### Rate Limiting
- Respects Facebook API rate limits (200 requests/hour, 4800/day)
- Automatic wait periods between requests
- Retry logic with exponential backoff

## Setup Instructions

1. **Import Workflows**: Import each workflow JSON file into n8n
2. **Configure Credentials**: Update `shared_config_facebook.json` with:
   - Facebook Page Access Token
   - Facebook Page ID
   - Google Sheets Spreadsheet ID
   - OpenAI API Key (for content generation)
   - Seamlessly API Key and Endpoint
3. **Set Up Google Sheets**: Create a sheet named "Facebook Events Pipeline" with columns A-N as specified above
4. **Configure Facebook App**: Ensure your Facebook App has the following permissions:
   - `pages_manage_events`
   - `pages_read_engagement`
   - `pages_show_list`
5. **Test Workflows**: Test each workflow individually before enabling schedules:
   - Start with manual triggers
   - Verify data flow through each step
   - Check Google Sheets updates
   - Verify Facebook event creation and posting

## Workflow Execution Order

### Main Pipeline
1. **Discovery** (daily at 9 AM) - Finds new events from Seamlessly
2. **Image Optimization** (daily at 8 AM) - Ensures all events have valid images
3. **Content Generation** (daily at 10 AM) - Creates Facebook-ready content
4. **Event Creation** (every 2 hours) - Creates Facebook events 14 days before event date
5. **Page Posting** (every 3 hours) - Posts to Facebook Page at optimal times
6. **Reminders** (hourly) - Sends reminders 48h, 24h, and 4h before events
7. **Cross-Platform Sync** (every 4 hours) - Syncs to Instagram and aggregates metrics

### Support Workflows
8. **Failure Recovery** (hourly) - Automatically retries failed events
9. **Post-Event Analytics** (daily at 6 AM) - Analyzes completed events and generates insights

## Status Flow

```
discovered → content_ready → event_created → posted → (reminders sent) → analytics_complete
```

Additional statuses:
- `rate_limited` - Temporarily paused due to API rate limits
- `error` / `Failed` - Error occurred, check notes column (Agent 8 will attempt recovery)
- `skipped` - Event skipped (e.g., posting date not reached)
- `scheduled` - Post scheduled for optimal time
- `Analytics Complete` - Post-event analysis finished
- `CRITICAL - Max Retries Exceeded` - Requires manual intervention

## Notes

- All workflows include rate limit handling and retry logic
- Image uploads are optional - workflows will continue without images (Agent 9 ensures images exist)
- Multi-venue events are supported with venue separator formatting
- RSVP counts are calculated as (attending + interested) from Facebook
- Ticket sales are synced from Seamlessly API when available
- Failed events are automatically recovered by Agent 8 (up to 3 retries)
- Post-event analytics feed back into AI content generation for continuous improvement

## Additional Sheets Required

### AI Learning Data Sheet
Create a new sheet named "AI Learning Data" with columns:
- A: event_type
- B: content_style
- C: posting_time
- D: posting_day
- E: engagement_rate
- F: performance_score
- G: successful_opening
- H: optimal_length
- I: used_urgency
- J: learned_at

This sheet stores successful content patterns for Agent 2 to learn from.

## Extended Columns

Add these columns to "Facebook Events Pipeline" for full functionality:

**Analytics (Agent 7):**
- W: fb_event_attending
- X: fb_event_total_rsvps
- Y: fb_post_impressions
- Z: fb_post_engagement_rate
- AA: ig_impressions
- AB: tickets_sold
- AC: social_attribution_percent
- AD: roi_percent
- AE: performance_score
- AF: performance_tier
- AG: ai_summary
- AH: ai_recommendations
- AI: analytics_completed_at

**Recovery (Agent 8):**
- AJ: retry_count
- AK: failure_type
- AL: recovered_at

**Images (Agent 9):**
- AM: image_source
- AN: image_generated_at
- AO: image_validation_status
- AP: image_file_size
