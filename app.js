// // dependencies
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');
// const formatMessage = require('./utils/messages');
// const {
//    userJoin,
//    getCurrentUser,
//    userLeave,
//    getRoomUsers,
// } = require('./utils/users');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // set static file
// app.use(express.static(path.join(__dirname, 'public')));

// const botName = 'XeroxChat Bot';

// // run when client connects
// io.on('connection', (socket) => {
//    socket.on('joinRoom', ({ username, room }) => {
//       const user = userJoin(socket.id, username, room);

//       socket.join(user.room);

//       // welcome current user
//       socket.emit('message', formatMessage(botName, 'Welcome to XeroxChat!'));

//       // broadcast when a user connects
//       socket.broadcast
//          .to(user.room)
//          .emit(
//             'message',
//             formatMessage(botName, `${user.username} has joined the chat!`)
//          );

//       // send users and room info
//       io.to(user.room).emit('roomUsers', {
//          room: user.room,
//          users: getRoomUsers(user.room),
//       });
//    });

//    // listen for chatMessage
//    socket.on('chatMessage', (msg) => {
//       const user = getCurrentUser(socket.id);

//       io.to(user.room).emit('message', formatMessage(user.username, msg));
//    });

//    // runs when clients disconnects
//    socket.on('disconnect', () => {
//       const user = userLeave(socket.id);

//       if (user) {
//          io.to(user.room).emit(
//             'message',
//             formatMessage(botName, `${user.username} has left the chat!`)
//          );

//          // send users and room info
//          io.to(user.room).emit('roomUsers', {
//             room: user.room,
//             users: getRoomUsers(user.room),
//          });
//       }
//    });
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//    console.log(`🎯 Server is running on PORT: ${PORT}`);
// });
// dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const formatMessage = require('./utils/messages');
const {
   userJoin,
   getCurrentUser,
   userLeave,
   getRoomUsers,
} = require('./utils/users');

// MongoDB Connection
mongoose.connect('mongodb+srv://rahulbus145:Anshj870755@chating-data.tpfb5.mongodb.net/?retryWrites=true&w=majority&appName=chating-data').then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Failed to connect to MongoDB', err));

// Message model
const Message = mongoose.model('Message', new mongoose.Schema({
   username: String,
   text: String,
   time: String,
   room: String,
}));

const app = express();
const server = http.createServer(app);
app.use(cors());
const io = socketIo(server, {
   cors: {
      origin: "/index.html", // Or specify the frontend URL if needed, e.g., 'https://yourfrontend.com'
      methods: ["GET", "POST"],
   },
});

// set static file
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'XeroxChat Bot';

// run when client connects
io.on('connection', (socket) => {
   socket.on('joinRoom', async ({ username, room }) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);

      // Fetch old messages from MongoDB
      const messages = await Message.find({ room: user.room }).lean();
      socket.emit('oldMessages', messages);

      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to XeroxChat!'));

      // Broadcast when a user connects
      socket.broadcast
         .to(user.room)
         .emit(
            'message',
            formatMessage(botName, `${user.username} has joined the chat!`)
         );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
         room: user.room,
         users: getRoomUsers(user.room),
      });
   });

   // listen for chatMessage
   socket.on('chatMessage', async (msg) => {
      const user = getCurrentUser(socket.id);
      const messageData = formatMessage(user.username, msg);

      // Save the message to MongoDB
      const message = new Message({
         username: user.username,
         text: msg,
         time: messageData.time,
         room: user.room,
      });
      await message.save();

      io.to(user.room).emit('message', messageData);
   });

   // runs when clients disconnect
   socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
         io.to(user.room).emit(
            'message',
            formatMessage(botName, `${user.username} has left the chat!`)
         );

         // Send users and room info
         io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
         });
      }
   });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
   console.log(`🎯 Server is running on PORT: ${PORT}`);
});
