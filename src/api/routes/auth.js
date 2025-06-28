const express = require('express');
const router = express.Router();
const QuickBooksService = require('../../services/QuickBooksService');

// Initialize services
const qbService = new QuickBooksService();
let userTokens = {};

// QuickBooks OAuth endpoints
router.get('/quickbooks', (req, res) => {
  try {
    const authUri = qbService.getAuthUri();
    res.json({ 
      success: true,
      authUri: authUri,
      message: 'Visit this URL to authorize QuickBooks access'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const tokenData = await qbService.handleCallback(req.url);
    userTokens = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      realmId: tokenData.realmId
    };
    
    res.json({ 
      success: true, 
      message: 'QuickBooks connected successfully! You can now upload transaction files.',
      realmId: tokenData.realmId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to attach user tokens to request
router.use((req, res, next) => {
  req.userTokens = userTokens;
  next();
});

module.exports = router;
