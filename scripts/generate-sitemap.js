const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

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

  // Generate sitemap
  const sitemapXML = await streamToPromise(sitemap);
  
  // Write to public directory
  const publicPath = path.join(__dirname, '../public/sitemap.xml');
  require('fs').writeFileSync(publicPath, sitemapXML.toString());
  
  console.log('Sitemap generated successfully!');
};

generateSitemap().catch(console.error);
