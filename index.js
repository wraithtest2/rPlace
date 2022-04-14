const express = require('express');
const app = express();
const http = require('node:http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let SOCKETS = {}
let map = []
let cooldown = []

const SIZE = 50

for (let x = 0; x < SIZE; x++) {
  for (let y = 0; y < SIZE; y++) {
    map.push({
      by: null,
      color: "ffffff"
    })
  }
}
  
io.on('connection', (socket) => {
  socket.emit("initMap",map)
  const id = socket.id.split('').map((el,i)=>i % 2 == 0 ? '' : el).join('')
  SOCKETS[id] = socket
  
 const ip = socket.handshake.headers["x-forwarded-for"];
  if(cooldown.filter(e=>e.ip==ip).length < 1) {
    cooldown.push({
      ip,
      time:(new Date().getTime() - 5 * 60 * 1000)
    })
  }
  socket.on('newPixel', (data) => {
    if(cooldown.filter(e=>e.ip==ip).length < 1) return;
    const cTime = new Date().getTime()
    const tDiff = cTime - cooldown.filter(e=>e.ip==ip)[0].time
    if(tDiff < 5 * 60 * 1000) {
      socket.emit("cooldown",tDiff)
      return;
    };
    cooldown.filter(e=>e.ip==ip)[0].time = cTime
    map[data.index] = {
      by: id,
      color: data.color
    }
    for (let i in SOCKETS) {
      const SOCKET = SOCKETS[i]
      SOCKET.emit("updatePixel",{
        index:data.index,
        color: data.color
      })
    }
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
