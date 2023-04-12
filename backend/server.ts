const { Socket } = require("socket.io");

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

server.listen(3001, () => {
    console.log("SERVER IS LISTENING ON PORT 3001");
});

const clients = new Map();

io.on("connection", (socket: any) => {
    socket.emit("handshakeStart");

    //add custom events here
    socket.on("newClient", () => {
        let latestClientID = 1;
        if (clients.size == 0) latestClientID = 1;
        else {
            while (Array.from(clients.values()).includes(latestClientID)) {
                latestClientID++;
            }
        }

        socket.emit("setID", { id: latestClientID });
    });

    socket.on("handshakeComplete", (myData: any) => {
        let id = myData.id;
        // Check for repetitive emits
        if (!Array.from(clients.values()).includes(id)) {
            clients.set(socket, parseInt(id));
            console.log(`Client ${id} connected with socket id ${socket.id}`);
        }
    });

    socket.on("myEvent", (myData: any) => {
        console.log("Received myMessage:", myData);
    });

    socket.on("disconnect", () => {
        let id = clients.get(socket);
        console.log(`Client ${id} disconnected with socket id ${socket.id}`);
        clients.delete(socket);
    });
});
