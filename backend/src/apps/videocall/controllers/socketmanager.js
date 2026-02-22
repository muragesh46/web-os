const connections = {};
const timeOnline = {};
const messages = {};
const userNames = {};

const connectToSocket = (io) => {


    io.on("connection", (socket) => {


        socket.on("join-call", (data) => {
            let path;
            let userName = 'Participant';

            if (typeof data === 'object') {
                path = data.path;
                userName = data.userName || 'Participant';
            } else {
                path = data;
            }

            userNames[socket.id] = userName;

            if (connections[path] === undefined) {
                connections[path] = []
            }
            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id)
            }

            timeOnline[socket.id] = new Date();

            // Send full list of current users to the new joiner
            const roomUserInfo = connections[path].map(id => ({ id, name: userNames[id] }));
            socket.emit("room-users", roomUserInfo);

            // Notify everyone else that this user joined
            connections[path].forEach(socketId => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("user-joined", socket.id, userName);
                }
            });

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("disconnect", () => {
            delete timeOnline[socket.id];

            for (const path in connections) {
                const index = connections[path].indexOf(socket.id);
                if (index !== -1) {
                    connections[path].splice(index, 1);

                    // Notify others in the room
                    connections[path].forEach(socketId => {
                        io.to(socketId).emit('user-left', socket.id);
                    });

                    if (connections[path].length === 0) {
                        delete connections[path];
                    }
                    break; // A socket is usually in only one room
                }
            }
        });


    })


    return io;
}

module.exports = { connectToSocket };
