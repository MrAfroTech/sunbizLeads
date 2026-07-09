/**
 * Wallet Pass Service
 * 
 * Standalone Express server for generating Apple Wallet and Google Wallet passes.
 * This service handles only pass generation to keep the main app bundle size small.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const appleRoutes = require('./routes/apple');
const googleRoutes = require('./routes/google');
const { authenticateRequest } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'wallet-pass-service',
    timestamp: new Date().toISOString()
  });
});

// API routes (require authentication)
app.use('/api/passes/apple', authenticateRequest, appleRoutes);
app.use('/api/passes/google', authenticateRequest, googleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Wallet Pass Service running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🍎 Apple passes: POST /api/passes/apple`);
  console.log(`🤖 Google passes: POST /api/passes/google`);
});

module.exports = app;

