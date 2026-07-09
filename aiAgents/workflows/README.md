# n8n Workflow Collection - Photo Booth Outreach Automation

This directory contains 6 automated workflows for lead discovery, contact extraction, lead scoring, email personalization, email sending, and follow-up management.

## Workflow Overview

1. **01_lead_discovery.json** - Discovers leads from Google Maps API
2. **02_contact_extraction.json** - Extracts contact emails from websites
3. **03_lead_scoring.json** - Scores leads using AI
4. **04_email_writer.json** - Generates personalized emails
5. **05_email_sender.json** - Sends emails with rate limiting
6. **06_follow_up.json** - Manages follow-up emails

## Setup Instructions

1. Import each workflow JSON file into n8n
2. Configure credentials in `shared_config.json`
3. Set up Google Sheets with the required columns
4. Test each workflow individually before enabling schedules

## Configuration

See `shared_config.json` for credential placeholders and global settings.


