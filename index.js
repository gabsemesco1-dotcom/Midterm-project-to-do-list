
const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;

// Import middleware
const {
  logger,
  notFound,
  errorHandler
} = require('./middleware');

// Import task routes
const taskRoutes = require('./routes/tasks');
const categoryRoutes = require('./routes/categories');

// Global middleware
app.use(express.json());
app.use(logger);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to my To-do List API!',
    student: 'GABRIEL',
    theme: 'To-do List'
  });
});

// Task routes
app.use('/tasks', taskRoutes);
app.use('/categories', categoryRoutes);

// Serve the frontend without changing the API welcome route.
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use('/app', express.static(path.join(__dirname, 'public')));

// Wildcard route
app.get('/files/*path', (req, res) => {
  res.json({
    path: req.params.path
  });
});

// 404 handler
app.use(notFound);

// General error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
