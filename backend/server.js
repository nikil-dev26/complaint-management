import dns from 'node:dns';

// DNS Fix - MongoDB connection-ku munnaadi
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';

dotenv.config();

// Express App
const app = express();

// HTTP Server
const server = http.createServer(app);

// Multiple origins support (comma-separated in CLIENT_URL env)
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without Origin header (Postman, curl, mobile apps, health checks)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

// Socket.IO Setup
const io = new Server(server, {
  cors: corsOptions,
});

// Express CORS + Preflight
app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// Attach Socket.IO to Express
app.set('io', io);

// Socket Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Test Route
app.get('/', (req, res) => {
  res.send('Real-Time Complaint Management API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server after DB connection
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Failed:', err);
  });