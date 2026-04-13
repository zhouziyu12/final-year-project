// Custom error classes

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class BlockchainError extends AppError {
  constructor(message) {
    super(message, 502);
    this.name = 'BlockchainError';
  }
}

// Error response helpers

/**
 * Send a success response.
 */
export const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
};

/**
 * Send an error response with an HTTP status code.
 */
export const error = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message
  };
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }
  return res.status(statusCode).json(response);
};

/**
 * Wrap an async route handler and forward errors.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation helpers

/**
 * Ensure that an object contains all required fields.
 */
export const validateRequired = (obj, fields) => {
  const missing = fields.filter((field) => !obj[field]);
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

/**
 * Validate a model ID.
 */
export const validateModelId = (id) => {
  const num = parseInt(id, 10);
  if (Number.isNaN(num) || num <= 0) {
    throw new ValidationError('Invalid model ID');
  }
  return num;
};

/**
 * Validate a basic Ethereum address format.
 */
export const validateAddress = (addr) => {
  if (!addr || typeof addr !== 'string') {
    throw new ValidationError('Invalid address');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new ValidationError('Invalid Ethereum address format');
  }
  return addr;
};

/**
 * Validate the requested network.
 */
export const validateNetwork = (network) => {
  const validNetworks = ['sepolia', 'tbnb'];
  if (!validNetworks.includes(network)) {
    throw new ValidationError(`Invalid network. Must be one of: ${validNetworks.join(', ')}`);
  }
  return network;
};

// Logging

export const logError = (err, req = null) => {
  const timestamp = new Date().toISOString();
  const reqInfo = req ? `[${req.method} ${req.path}]` : '[UNKNOWN]';
  console.error(`[ERROR] ${timestamp} ${reqInfo} ${err.message}`);
  if (!err.isOperational) {
    console.error('[ERROR] Stack:', err.stack);
  }
};
