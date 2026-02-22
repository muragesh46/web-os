const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');

require('dotenv').config({ path: '../.env' }); // Load .env from root
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

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: '✅ Web OS Backend is running!' });
});

// Mount app routes
app.use('/api/auth', require('./apps/auth/routes'));
app.use('/api/chat', require('./apps/chat/routes'));
// app.use('/api/maps', require('./apps/maps/routes'));
// app.use('/api/music', require('./apps/music/routes'));
app.use('/api/videocall', require('./apps/videocall/routes/routes'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});

