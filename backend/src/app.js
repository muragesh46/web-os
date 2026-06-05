require('dotenv').config({ path: '../.env' });
require('../.env.validation.js'); // Validate env vars

const express = require('express');
const http = require('http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { helmetConfig, sanitizeData, sanitizeXss } = require('./middleware/security');
const { setupSwagger } = require('./config/swagger');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// Videocall socket (existing)
const { connectToSocket } = require('./apps/videocall/controllers/socketmanager');
connectToSocket(io);

// Chat socket (new — uses /chat namespace)
const { initChatSocket } = require('./apps/chat/chat.socket');
const chatIo = io.of('/chat');
initChatSocket(chatIo);

// Security Middleware
app.use(helmetConfig);

// CORS Middleware
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn('CORS Origin not allowed', { origin });
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Data Sanitization
app.use(sanitizeData);
app.use(sanitizeXss);

// Rate Limiting Middleware
const generalLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

const agentLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request rate limit exceeded. Please wait a moment.' },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', { ip: req.ip });
    res.status(429).json({ error: 'AI request rate limit exceeded. Please wait a moment.' });
  },
});

app.use('/api', generalLimit);
app.use('/api/agent', agentLimit);

// Serve static frontend in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
} else {
  // Health Check for dev
  app.get('/', (req, res) => {
    res.json({ status: '✅ Web OS Backend is running!' });
  });
}

// API Documentation
setupSwagger(app);

// Mount App Routes
app.use('/api/auth', require('./apps/auth/routes'));
app.use('/api/chat', require('./apps/chat/routes'));
app.use('/api/finder', require('./apps/finder/routes'));
app.use('/api/photos', require('./apps/photos/routes'));
app.use('/api/videocall', require('./apps/videocall/routes/routes'));
app.use('/api/agent', require('./apps/agent/routes'));
app.use('/api/code', require('./apps/code/routes'));

// 404 Handler and Frontend fallback
app.use((req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  } else {
    logger.warn('Route not found', { method: req.method, path: req.path });
    res.status(404).json({ success: false, message: 'Route not found' });
  }
});

// Global Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`🚀 Backend running on port ${PORT}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;