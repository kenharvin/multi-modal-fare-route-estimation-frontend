// Simple proxy server to forward API requests from phone to backend
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;
const BACKEND_URL = 'http://localhost:8000';

// Enable CORS with permissive settings for development
app.use(cors({
  origin: '*',
  credentials: true
}));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/proxy-health', (req, res) => {
  res.json({ status: 'ok', proxying_to: BACKEND_URL });
});

// Proxy all other requests to backend
app.use('/', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying ${req.method} ${req.url} to ${BACKEND_URL}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response ${proxyRes.statusCode} from ${BACKEND_URL}${req.url}`);
  }
}));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`   Forwarding requests to: ${BACKEND_URL}`);
  console.log(`\n📱 Update your .env to use:`);
  console.log(`   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.242:${PORT}\n`);
  console.log(`Test the proxy: http://192.168.1.242:${PORT}/proxy-health\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close();
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close();
  process.exit(0);
});

// Prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
