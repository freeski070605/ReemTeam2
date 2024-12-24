const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
require('dotenv').config();

const User = require('./models/User');
const Game = require('./models/Game');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const tableRoutes = require('./routes/tableRoutes'); // Ensure this is imported
const { handleWebSocketConnection } = require('./models/useWebSocket');

const app = express();

// Configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend's origin
  credentials: true // Allow credentials (cookies, HTTP authentication)
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Ensure environment variables are set
if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET || !process.env.FRONTEND_ORIGIN) {
  throw new Error('Missing required environment variables');
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/users', userRoutes);
app.use('/games', gameRoutes);
app.use('/tables', tableRoutes); // Ensure this line is present

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the HTTP server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start the WebSocket server
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => handleWebSocketConnection(socket, io));
