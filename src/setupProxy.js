const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy middleware...');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.url} to http://localhost:3001${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err);
      }
    })
  );
  
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.url} to http://localhost:3001${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err);
      }
    })
  );
  
  console.log('✅ Proxy middleware configured for /api and /auth routes');
};
