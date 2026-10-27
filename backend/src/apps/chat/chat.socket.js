const jwt = require('jsonwebtoken');
const User = require('../auth/user.model');
const Message = require('./message.model');

// Map: userId -> Set<socketId>
const onlineUsers = new Map();

function initChatSocket(io) {
    // Authenticate socket via JWT token
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('No token'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Auth failed'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user._id.toString();
        console.log(`💬 Chat: ${socket.user.displayName} connected (${socket.id})`);

        // Join user room for multi-device/multi-tab delivery
        socket.join(userId);

        // Track online status with Set of sockets
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        await User.findByIdAndUpdate(userId, { isOnline: true });

        // Broadcast online users list
        io.emit('online-users', Array.from(onlineUsers.keys()));

        // Handle sending a message
        socket.on('send-message', async (data) => {
            try {
                const { receiverId, text } = data;
                if (!receiverId || !text?.trim()) return;

                // Save to DB
                const message = await Message.create({
                    sender: userId,
                    receiver: receiverId,
                    text: text.trim(),
                });

                const populated = await message.populate([
                    { path: 'sender', select: 'displayName fullName email' },
                    { path: 'receiver', select: 'displayName fullName email' },
                ]);

                // Send to receiver room (all receiver tabs)
                io.to(receiverId).emit('new-message', populated);

                // Confirm to sender room (all sender tabs)
                io.to(userId).emit('message-sent', populated);
            } catch (err) {
                console.error('Send message error:', err);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing', (receiverId) => {
            io.to(receiverId).emit('user-typing', userId);
        });

        socket.on('stop-typing', (receiverId) => {
            io.to(receiverId).emit('user-stop-typing', userId);
        });

        // Handle Video Call Signaling
        socket.on('call-user', (data) => {
            const { receiverId, meetingId } = data;
            console.log(`📞 RELAY: Call from ${socket.user.displayName} to user ${receiverId}`);
            io.to(receiverId).emit('incoming-call', {
                callerId: userId,
                callerName: socket.user.displayName,
                meetingId
            });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`💬 Chat: ${socket.user.displayName} disconnected (${socket.id})`);
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    await User.findByIdAndUpdate(userId, { isOnline: false });
                }
            }
            io.emit('online-users', Array.from(onlineUsers.keys()));
        });
    });
}

module.exports = { initChatSocket };
