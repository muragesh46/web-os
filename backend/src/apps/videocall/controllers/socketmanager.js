const connections = {};
const timeOnline = {};
const messages = {};
const userNames = {};

const removeSocketFromRooms = (io, socketId) => {
    delete timeOnline[socketId];
    delete userNames[socketId];

    for (const path in connections) {
        const index = connections[path].indexOf(socketId);
        if (index !== -1) {
            connections[path].splice(index, 1);
            console.log(`👋 Socket ${socketId} removed from room ${path}, remaining:`, connections[path].length);

            // Notify remaining participants
            connections[path].forEach(sid => {
                io.to(sid).emit('user-left', socketId);
            });

            if (connections[path].length === 0) {
                delete connections[path];
                delete messages[path];
            }
        }
    }
};

const connectToSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`🔌 Video socket connected: ${socket.id}`);

        socket.on("join-call", (data) => {
            let path;
            let userName = 'Participant';

            if (typeof data === 'object') {
                path = data.path;
                userName = data.userName || 'Participant';
            } else {
                path = data;
            }

            if (!path) return;

            // Remove socket from any prior rooms before joining a new one
            removeSocketFromRooms(io, socket.id);

            userNames[socket.id] = userName;
            timeOnline[socket.id] = new Date();

            if (!connections[path]) {
                connections[path] = [];
            }
            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
            }

            console.log(`📹 User "${userName}" (${socket.id}) joined room "${path}". Total users in room:`, connections[path].length);

            // Send full list of current users to the new joiner
            const roomUserInfo = connections[path].map(id => ({ id, name: userNames[id] || 'Participant' }));
            socket.emit("room-users", roomUserInfo);

            // Notify everyone else in the room that this user joined
            connections[path].forEach(socketId => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("user-joined", socket.id, userName);
                }
            });

            // Send room message history to the new joiner
            if (messages[path] && messages[path].length > 0) {
                messages[path].forEach(m => {
                    socket.emit("chat-message", m.data, m.sender, m['socket-id-sender']);
                });
            }
        });

        socket.on("signal", (toId, message) => {
            if (toId) {
                io.to(toId).emit("signal", socket.id, message);
            }
        });

        socket.on("chat-message", (data, sender, targetPath) => {
            let matchingRoom = targetPath;
            if (!matchingRoom || !connections[matchingRoom]?.includes(socket.id)) {
                for (const [roomKey, roomValue] of Object.entries(connections)) {
                    if (roomValue.includes(socket.id)) {
                        matchingRoom = roomKey;
                        break;
                    }
                }
            }

            if (matchingRoom && connections[matchingRoom]) {
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    sender: sender || userNames[socket.id] || 'Participant',
                    data,
                    'socket-id-sender': socket.id
                });

                console.log(`💬 In-call chat [${matchingRoom}] from ${sender}: ${data}`);

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender || userNames[socket.id] || 'Participant', socket.id);
                });
            }
        });

        socket.on("leave-call", () => {
            console.log(`🚪 User requested leave-call: ${socket.id}`);
            removeSocketFromRooms(io, socket.id);
        });

        socket.on("disconnect", () => {
            console.log(`👋 Video socket disconnected: ${socket.id}`);
            removeSocketFromRooms(io, socket.id);
        });
    });

    return io;
};

module.exports = { connectToSocket };
