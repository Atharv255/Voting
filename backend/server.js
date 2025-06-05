const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://vote:vote123@cluster0.2vr7yhe.mongodb.net/voting-system';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    createDefaultAdmin();
  })
  .catch((error) => console.error('MongoDB connection error:', error));

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });

    if (!existingAdmin) {
      const defaultAdmin = new User({
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'admin@123',
        fullName: 'System Administrator',
        isAdmin: true
      });

      await defaultAdmin.save();
      console.log('Default admin user created: admin@gmail.com / admin@123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/admin', require('./routes/admin'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Voting System API is running!' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
