const express = require('express');
const path = require('path');
const Url = require('../models/Url');
const { validateUrl } = require('../utils/urlValidator');
const { generateShortCode } = require('../utils/codeGenerator');

const router = express.Router();

router.post('/api/shorten', async (req, res) => {
  const { url } = req.body || {};

  const validation = validateUrl(url);
  if (!validation.isValid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  const normalizedUrl = validation.normalizedUrl;
  let shortCode;
  let savedRecord;
  let attempts = 0;

  while (attempts < 5) {
    attempts++;
    shortCode = generateShortCode(6);
    try {
      savedRecord = await Url.create({ shortCode, originalUrl: normalizedUrl });
      break;
    } catch (err) {
      if (err.code === 11000) continue;
      console.error('Database save error:', err);
      return res.status(500).json({ success: false, error: 'Database save failed' });
    }
  }

  if (!savedRecord) {
    return res.status(500).json({ success: false, error: 'Could not generate unique short code' });
  }

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

  return res.status(201).json({
    success: true,
    data: {
      shortCode: savedRecord.shortCode,
      shortUrl: `${baseUrl}/${savedRecord.shortCode}`,
      originalUrl: savedRecord.originalUrl,
      clicks: savedRecord.clicks,
      createdAt: savedRecord.createdAt
    }
  });
});

router.get('/api/stats/:code', async (req, res) => {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ success: false, error: 'Short code is required' });
  }

  try {
    const record = await Url.findOne({ shortCode: code.trim() });
    if (!record) {
      return res.status(404).json({ success: false, error: 'Short code not found' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      data: {
        shortCode: record.shortCode,
        shortUrl: `${baseUrl}/${record.shortCode}`,
        originalUrl: record.originalUrl,
        clicks: record.clicks,
        createdAt: record.createdAt,
        lastAccessedAt: record.lastAccessedAt
      }
    });
  } catch (err) {
    console.error('Stats query error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

router.get('/:code', async (req, res, next) => {
  const { code } = req.params;

  if (code === 'favicon.ico' || code === 'robots.txt' || code === 'api') {
    return next();
  }

  try {
    const record = await Url.findOneAndUpdate(
      { shortCode: code },
      { $inc: { clicks: 1 }, lastAccessedAt: new Date() },
      { returnDocument: 'after' }
    );

    if (!record) {
      if (req.accepts('html')) {
        return res.status(404).sendFile(path.join(__dirname, '../../public/404.html'));
      }
      return res.status(404).json({ success: false, error: 'Short URL not found' });
    }

    return res.redirect(302, record.originalUrl);
  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
