# Seamlessly Sales Prospecting System - n8n Workflows

This directory contains automated workflows for B2B sales prospecting for Seamlessly, a hospitality technology platform.

## Workflow Overview

1. **01_lead_discovery_high_volume.json** - Discovers high-volume venues (stadiums, arenas, convention centers)
2. **01b_lead_discovery_bars_restaurants.json** - Discovers bars and restaurants with pain signal analysis
3. **02_contact_extraction_multi.json** - Extracts multiple decision-maker contacts from websites
4. **03_lead_scoring_advanced.json** - Advanced multi-factor lead scoring algorithm
5. **04_email_personalization_seamlessly.json** - Generates personalized Seamlessly pitch emails
6. **05_email_sender_tiered.json** - Tiered email sending with rate limits by lead priority
7. **06_follow_up_advanced.json** - Advanced follow-up management with engagement tracking
8. **07_stakeholder_mapping.json** - Maps multiple stakeholders and decision-makers

## Google Sheets Structure

**Sheet Name:** "Seamlessly Pipeline"

**Columns:**
- A: business_name
- B: category
- C: city
- D: address
- E: website
- F: email
- G: phone
- H: rating
- I: review_count
- J: pain_signals
- K: pos_system
- L: location_count
- M: score
- N: status
- O: contacted_date
- P: last_activity
- Q: place_id
- R: email_subject
- S: email_body
- T: engagement_level
- U: decision_maker_role
- V: estimated_monthly_loss

## Configuration

See `shared_config_seamlessly.json` for:
- Credential placeholders
- Seamlessly value propositions
- Industry pain points
- Integration partners
- Scoring thresholds
- Rate limits

## Setup Instructions

1. Import each workflow JSON file into n8n
2. Configure credentials in `shared_config_seamlessly.json`
3. Set up Google Sheets with the required columns
4. Test each workflow individually before enabling schedules
