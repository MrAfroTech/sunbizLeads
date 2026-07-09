/**
 * Local dev server — Node + Express + static `public/`.
 * Production on Vercel: static assets + `api/checkout.js` serverless.
 */
const path = require('path');
const express = require('express');
const checkoutHandler = require('./api/checkout');
const logSiteEvent = require('./backend/api/logSiteEvent');

const app = express();
const PORT = Number(process.env.PORT) || 3040;
const publicDir = path.join(__dirname, 'public');

const PRODUCT_DETAIL_SEGMENTS = [
  'stadiums',
  'festivals',
  'bars',
  'qsr',
  'food-trucks',
  'districts',
  'wristbands',
];

app.use(express.json({ limit: '32kb' }));

app.post('/api/checkout', (req, res) => {
  checkoutHandler(req, res);
});

app.post('/api/log-site-event', express.json(), logSiteEvent);

PRODUCT_DETAIL_SEGMENTS.forEach((seg) => {
  app.get([`/products/${seg}`, `/products/${seg}/`], (_req, res) => {
    res.sendFile(path.join(publicDir, 'products', seg, 'index.html'));
  });
});

app.get(['/products', '/products/', '/products.html'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'products.html'));
});

app.get(['/success', '/success/', '/success.html'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'success.html'));
});

const auditDir = path.join(__dirname, 'audit');
app.get(['/audit', '/audit/'], (_req, res) => {
  res.sendFile(path.join(auditDir, 'index.html'));
});
app.get(['/audit/start', '/audit/start/'], (_req, res) => {
  res.sendFile(path.join(auditDir, 'start', 'index.html'));
});
app.get(['/audit/results', '/audit/results/'], (_req, res) => {
  res.sendFile(path.join(auditDir, 'results', 'index.html'));
});
app.use('/audit', express.static(auditDir));

const mainStreetDir = path.join(__dirname, 'mainStreet');
app.get(['/mainStreet', '/mainStreet/'], (_req, res) => {
  res.sendFile(path.join(mainStreetDir, 'index.html'));
});
app.get(['/mainStreet/calculator', '/mainStreet/calculator/'], (_req, res) => {
  res.sendFile(path.join(mainStreetDir, 'calculator', 'index.html'));
});
app.get(['/mainStreet/calculator/results', '/mainStreet/calculator/results/'], (_req, res) => {
  res.sendFile(path.join(mainStreetDir, 'calculator', 'results.html'));
});
app.get(
  [
    '/mainStreet/playbook',
    '/mainStreet/playbook/',
    '/mainStreet/districtRetentionPlaybook.html',
  ],
  (_req, res) => {
    res.sendFile(path.join(mainStreetDir, 'districtRetentionPlaybook.html'));
  }
);
app.use('/mainStreet', express.static(mainStreetDir));

app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Scan & Scale dev server http://localhost:${PORT}`);
});
