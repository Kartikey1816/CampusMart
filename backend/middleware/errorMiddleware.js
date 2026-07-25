const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'MulterError') {
    statusCode = 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller.' : error.message;
  }
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(({ message: validationMessage }) => validationMessage).join(' ');
  }
  if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { notFound, errorHandler };
