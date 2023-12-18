// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const users = []
const app = express();
const server = http.createServer(app);
const io = new socketIO.Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı');

  socket.on('login', (credentials) => {
    console.log(`${credentials.username} giriş yaptı`);

    const existingUser = users.find((user) => user.id === socket.id);
    if (!existingUser) {
      users.push({ id: socket.id, username: credentials.username });
    }
    io.emit('users', users);
  });

  socket.on('logout', (credentials) => {
    console.log(`${credentials.username} çıkış yaptı`);

    const filteredUsers = users.filter((user) => user.username !== credentials.username);
    io.emit('users', filteredUsers);
    console.log('bir kullanıcı çıktı');
  });

  socket.on('message', (newMessage) => {
    console.log(`${newMessage.username}: ${newMessage.message}`);
    io.emit('message', newMessage);
  });

});

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});