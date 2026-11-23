
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

// Authentication token
const TOKEN = 'todo-secret-123';

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;

  if (token !== `Bearer ${TOKEN}`) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid or missing token.',
      status: 401
    });
  }

  next();
};

// Handle unknown routes
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// General error handler
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    status
  });
};

module.exports = {
  logger,
  requireAuth,
  notFound,
  errorHandler
};
