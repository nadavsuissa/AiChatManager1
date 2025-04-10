const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS with specific options
const corsOptions = {
  // Adjust origin based on your Render frontend URL
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://aichatmanager1.onrender.com'
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Fix for international character encoding
app.use((req, res, next) => {
  // Set proper charset for responses
  res.charset = 'utf-8';
  
  // Ensure Content-Type has charset specified
  if (req.headers['content-type'] && !req.headers['content-type'].includes('charset')) {
    req.headers['content-type'] = `${req.headers['content-type']}; charset=utf-8`;
  }
  
  next();
});

// Request logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// API Routes - MUST come before static serving
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Serve Frontend Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');

  // Serve static assets
  app.use(express.static(frontendBuildPath));

  // For all other GET requests, send back index.html
  // This relies on React Router to handle the specific path on the client-side
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
  });
} else {
  // Development-only routes (if any)
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the AiChatManager API (Development Mode)', version: '1.0.0' });
  });
}

// 404 route handler - This might not be reached if '*' handles it
// app.use((req, res, next) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Gracefully shutting down');
  // Close any database connections or cleanup tasks here
  
  // Exit the process
  process.exit(0);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Remove the module.exports = app; if it exists (it was for Vercel)
// module.exports = app; 