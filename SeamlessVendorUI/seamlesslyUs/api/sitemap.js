/**
 * Dynamic XML Sitemap Generator
 * Generates sitemap based on location data from SEO Lambda API
 */

import { getAllLocations } from '../src/services/locationDataService.js';

export default async function handler(req, res) {
  // Set XML content type
  res.setHeader('Content-Type', 'application/xml');
  
  try {
    // Get all locations from DynamoDB
    const locations = await getAllLocations();
    
    // Static pages with their priorities and change frequencies
    const staticPages = [
      {
        url: 'https://seamless.com/',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/demo/',
        priority: '0.9',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/increase-revenue/',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/reduce-expenses/',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/download/',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/cash-finder/',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/wine-walk/',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/kids-expo/',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/signup/',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/directsignup/',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/vendor-download/',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/vendor-integration/',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/dynamic-pricing/',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/schedule-chat/',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/calendar-box/',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: 'https://seamless.com/ezfest/',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      }
    ];
    
    // Generate location pages
    const locationPages = locations.map(location => {
      const priority = location.priority || 0.7;
      const changefreq = priority >= 0.9 ? 'weekly' : priority >= 0.8 ? 'monthly' : 'monthly';
      
      return {
        url: `https://seamless.com/locations/${location.location_id}/`,
        priority: priority.toString(),
        changefreq: changefreq,
        lastmod: location.updated_at ? location.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
      };
    });
    
    // Generate direct city routes (alternative URLs)
    const directCityRoutes = locations.map(location => {
      const priority = location.priority || 0.7;
      const changefreq = priority >= 0.9 ? 'weekly' : priority >= 0.8 ? 'monthly' : 'monthly';
      
      return {
        url: `https://seamless.com/${location.location_id}/`,
        priority: (priority * 0.9).toString(), // Slightly lower priority for direct routes
        changefreq: changefreq,
        lastmod: location.updated_at ? location.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
      };
    });
    
    // Combine all pages
    const allPages = [...staticPages, ...locationPages, ...directCityRoutes];
    
    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback sitemap with static pages only
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://seamless.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://seamless.com/demo/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://seamless.com/orlando/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://seamless.com/tampa/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    
    res.status(200).send(fallbackSitemap);
  }
}
