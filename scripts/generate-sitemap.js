import { SitemapStream, streamToPromise } from 'sitemap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSitemap = async () => {
  const sitemap = new SitemapStream({ hostname: 'https://cashflowapp.app' });
  
  // Define your routes
  const routes = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/contact', changefreq: 'monthly', priority: 0.8 },
    { url: '/features', changefreq: 'monthly', priority: 0.9 },
    { url: '/pricing', changefreq: 'monthly', priority: 0.9 },
    { url: '/help', changefreq: 'weekly', priority: 0.7 },
    { url: '/documentation', changefreq: 'weekly', priority: 0.7 },
    { url: '/tutorials', changefreq: 'weekly', priority: 0.6 },
    { url: '/support', changefreq: 'monthly', priority: 0.6 },
    { url: '/blog', changefreq: 'weekly', priority: 0.8 },
    { url: '/analytics', changefreq: 'weekly', priority: 0.8 },
    { url: '/integration', changefreq: 'weekly', priority: 0.8 },
    { url: '/transactions', changefreq: 'weekly', priority: 0.7 },
    { url: '/reports', changefreq: 'weekly', priority: 0.7 },
    { url: '/settings', changefreq: 'monthly', priority: 0.6 }
  ];

  // Write routes to sitemap
  routes.forEach(route => {
    sitemap.write({
      url: route.url,
      changefreq: route.changefreq,
      priority: route.priority,
      lastmod: new Date().toISOString()
    });
  });

  sitemap.end();

  try {
    // Generate sitemap
    const sitemapXML = await streamToPromise(sitemap);
    
    // Write to build directory (not public, since React builds to build/)
    const buildPath = path.join(__dirname, '../build/sitemap.xml');
    
    // Ensure build directory exists
    const buildDir = path.dirname(buildPath);
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    fs.writeFileSync(buildPath, sitemapXML.toString());
    
    console.log('Sitemap generated successfully!');
    console.log(`Sitemap saved to: ${buildPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
};

generateSitemap().catch(console.error);
