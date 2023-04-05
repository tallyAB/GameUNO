const { Socket } = require( "socket.io");

const express = require("express");
const app = express();
const http = require("http");
const {Server} = require('socket.io')
const cors = require('cors')

app.use(cors())
const server = http.createServer(app)
const io = new Server(
    server,{cors:{
        origin:"http://localhost:3001",
        methods: ["GET", "POST"]
    },
})

server.listen(3001, ()=>{
    console.log("SERVER IS LISTENING ON PORT 3001")
})
io.on("connection",(socket)=>{
    console.log("user connected with a socket id", socket.id)
    //add custom events here
    socket.on("myEvent",(myData)=>{
        console.log('Received myMessage:', myData);
    })

})
