const logger = require('../utils/logger');
const { toErrorMeta } = require('../utils/safeError');
const { errorResponse } = require('../utils/response');
const {
  AuthError,
  ValidationError,
  ExternalApiError,
  AIProviderError,
  PersistenceError,
  AppError,
  BillingAccessError,
  InsufficientCreditsError,
} = require('../shared/errors/customErrors');

function classifyError(err) {
  if (err instanceof AuthError || err.errorCode === 'AUTH_ERROR') {
    return {
      status: 401,
      type: 'auth_error',
      message: err.message || 'Authentication required',
      error: err.message || 'Authentication required',
      errorCode: err.errorCode || 'AUTH_ERROR',
    };
  }

  if (err instanceof ValidationError || err.errorCode === 'VALIDATION_ERROR') {
    return {
      status: 400,
      type: 'validation_error',
      message: err.message || 'Validation failed',
      error: err.message || 'Validation failed',
      errorCode: err.errorCode || 'VALIDATION_ERROR',
      errors: err.errors ? Object.values(err.errors) : undefined,
    };
  }

  if (
    err instanceof ExternalApiError ||
    err instanceof AIProviderError ||
    err.type === 'external_api_error' ||
    err.errorCode === 'EXTERNAL_API_ERROR' ||
    err.errorCode === 'AI_PROVIDER_ERROR'
  ) {
    const status = err.statusCode && err.statusCode !== 401 ? err.statusCode : 502;
    return {
      status,
      type: 'external_api_error',
      message: err.message || 'External service temporarily unavailable',
      error: err.message || 'External service temporarily unavailable',
      errorCode: err.errorCode || 'EXTERNAL_API_ERROR',
    };
  }

  if (err instanceof PersistenceError || err.errorCode === 'PERSISTENCE_ERROR') {
    return {
      status: 500,
      type: 'database_error',
      message: 'Database operation failed',
      error: 'Database operation failed',
      errorCode: err.errorCode || 'PERSISTENCE_ERROR',
    };
  }

  if (
    err.errorCode === 'INSUFFICIENT_CREDITS' ||
    err instanceof InsufficientCreditsError
  ) {
    return {
      status: 402,
      type: 'billing_error',
      message: err.message || 'Insufficient credits',
      error: err.message || 'Insufficient credits',
      errorCode: 'INSUFFICIENT_CREDITS',
      details: err.details || undefined,
    };
  }

  if (
    err.type === 'billing_error' ||
    err instanceof BillingAccessError ||
    err.errorCode === 'GATEWAY_EXPIRED' ||
    err.errorCode === 'BILLING_ACCESS_DENIED'
  ) {
    return {
      status: err.statusCode || 403,
      type: 'billing_error',
      message: err.message || 'Billing access denied',
      error: err.message || 'Billing access denied',
      errorCode: err.errorCode || 'BILLING_ACCESS_DENIED',
    };
  }

  if (err instanceof AppError) {
    const status = err.statusCode === 401 ? 502 : err.statusCode || 500;
    return {
      status,
      type: status >= 500 ? 'unknown_error' : 'validation_error',
      message: err.message || 'Something went wrong. Please try again later',
      error: err.message || 'Something went wrong. Please try again later',
      errorCode: err.errorCode || 'APP_ERROR',
    };
  }

  let status =
    typeof err?.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;

  // Never treat upstream/third-party 401 as an app auth failure.
  if (status === 401 && err?.errorCode !== 'AUTH_ERROR') {
    status = 502;
  }

  const isServerError = status >= 500;
  return {
    status,
    type: isServerError ? 'unknown_error' : 'validation_error',
    message: isServerError
      ? 'Something went wrong. Please try again later'
      : err?.message || 'Request could not be completed',
    error: isServerError
      ? 'Something went wrong. Please try again later'
      : err?.message || 'Request could not be completed',
    errorCode: err?.errorCode || undefined,
    errors: Array.isArray(err?.errors) ? err.errors : undefined,
  };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err && err.name === 'MulterError') {
    err.status = 400;
    err.message = err.code === 'LIMIT_FILE_SIZE' ? 'Screenshot size must be 5MB or less' : 'Invalid upload request';
    err.errorCode = err.code || 'UPLOAD_VALIDATION_FAILED';
  }
  if (err && err.message === 'Only image files are allowed') {
    err.status = 400;
    err.errorCode = 'INVALID_IMAGE_FORMAT';
  }

  const classified = classifyError(err);

  logger.error('💥 GLOBAL ERROR CAUGHT:', {
    ...toErrorMeta(err),
    url: req.url,
    method: req.method,
    requestId: req.headers['x-request-id'] || undefined,
    status: classified.status,
    type: classified.type,
    provider: err?.provider || undefined,
    upstreamStatus: err?.details?.upstreamStatus || err?.response?.status || undefined,
  });

  return errorResponse(res, {
    status: classified.status,
    message: classified.message,
    error: classified.error,
    type: classified.type,
    errors: classified.errors,
    errorCode: classified.errorCode,
    details: classified.details,
  });
}

module.exports = { errorHandler, classifyError };
