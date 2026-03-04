require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/database');

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user:status', { userId, status: 'online' });
    console.log(`User ${userId} is online`);
  });

  // Send message
  socket.on('message:send', async (data) => {
    try {
      const { receiverId, message, messageType, attachments } = data;
      const { Message } = require('./src/models/Message');

      const newMessage = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content: message,
        messageType,
        attachments
      });

      await newMessage.populate('sender receiver');

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:receive', newMessage);
      }

      // Send back to sender
      socket.emit('message:sent', newMessage);
    } catch (error) {
      socket.emit('message:error', { error: error.message });
    }
  });

  // Message read
  socket.on('message:read', async (messageId) => {
    try {
      const { Message } = require('./src/models/Message');
      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: Date.now()
      });

      socket.emit('message:read:success', messageId);
    } catch (error) {
      socket.emit('message:error', { error: error.message });
    }
  });

  // Typing indicator
  socket.on('typing:start', (receiverId) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: true
      });
    }
  });

  socket.on('typing:stop', (receiverId) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: false
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user:status', { userId: socket.userId, status: 'offline' });
      console.log(`User ${socket.userId} disconnected`);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
