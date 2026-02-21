#!/usr/bin/env node
require('./lib/load-env');
const { getSunbizSheet } = require('./lib/sheet-client');

async function main() {
  console.log('Florida Sunbiz Scraper - Division of Corporations');

  try {
    const businessesSheet = await getSunbizSheet('Florida Businesses');
    const errorSheet = await getSunbizSheet('Error Log');

    const newBusinesses = await scrapeSunbiz();

    if (newBusinesses.length > 0) {
      await businessesSheet.addRows(newBusinesses);
      console.log('Added ' + newBusinesses.length + ' Florida businesses');
    } else {
      console.log('No new businesses found');
    }
  } catch (error) {
    const isJsonError = error instanceof SyntaxError || (error.message && error.message.includes('JSON'));
    if (isJsonError) {
      console.error('Florida Sunbiz failed (JSON parse error):', error.message);
      console.error('This usually means: (1) credentials/google-sheets-service-account.json is empty or invalid JSON, or (2) the sheet is not shared with the service account email. Fix credentials and try again.');
    } else {
      console.error('Florida Sunbiz failed:', error.message);
    }
    if (!isJsonError) {
      try {
        const errorSheet = await getSunbizSheet('Error Log');
        await errorSheet.addRow({
          Timestamp: new Date().toISOString(),
          Error: error.message,
          Workflow: 'Florida Sunbiz Scraper',
          Date: new Date().toDateString(),
          URL: 'http://search.sunbiz.org',
        });
      } catch (e) {
        console.error('Could not write to Error Log:', e.message);
      }
    }
  }
}

const CATEGORIES = [
  'stadium',
  'arena',
  'casino',
  'theme park',
  'university dining',
  'airport concessions',
  'restaurant chain',
  'golf management',
  'marina',
  'hotel F&B',
  'entertainment venue',
];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function domainFromLink(link) {
  try {
    const u = new URL(link.startsWith('http') ? link : 'https://' + link);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return link || '';
  }
}

/** Extract a number that might be "X locations" or "X+ locations" from snippet */
function parseLocationCountFromSnippet(snippet) {
  if (!snippet) return '';
  const m = snippet.match(/(\d+)\+?\s*locations?/i) || snippet.match(/(\d+)\+?\s*venues?/i) || snippet.match(/(\d+)\+?\s*sites?/i);
  return m ? m[1] : '';
}

/** SerpAPI Google search; returns organic_results or [] */
async function serpApiSearch(query, apiKey, location = 'Florida, United States') {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    location,
    gl: 'us',
    hl: 'en',
    num: 10,
  });
  const url = `https://serpapi.com/search?${params.toString()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error || 'SerpAPI error');
  return data.organic_results || [];
}

function rowFromOrganic(item, category) {
  const link = item.link || '';
  const title = item.title || '';
  const displayed = item.displayed_link || domainFromLink(link);
  const snippet = item.snippet || '';
  const locCount = parseLocationCountFromSnippet(snippet);
  return {
    Company: title,
    Filing_Date: '',
    Status: 'Active',
    URL: link,
    County: '',
    Registered_Agent: '',
    Website: displayed,
    Location_Count: locCount,
    Category: category,
    City: 'Florida',
    State: 'FL',
  };
}

async function scrapeSunbiz() {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('SERPAPI_API_KEY missing; returning no results');
    return [];
  }

  const seen = new Set();
  const rows = [];

  for (const category of CATEGORIES) {
    const query = `Florida ${category} multi-location operators companies headquarters`;
    try {
      const results = await serpApiSearch(query, apiKey);
      for (const item of results) {
        const link = item.link || '';
        if (!link || seen.has(link)) continue;
        seen.add(link);
        rows.push(rowFromOrganic(item, category));
      }
      await delay(800);
    } catch (err) {
      console.warn(`SerpAPI search failed for "${category}":`, err.message);
    }
  }

  return rows;
}

main().catch(console.error);
