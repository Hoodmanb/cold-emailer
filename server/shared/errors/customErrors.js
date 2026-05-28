/**
 * CareerBot Custom Error Hierarchy
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication required', errorCode = 'AUTH_ERROR') {
    super(message, 401, errorCode);
    this.type = 'auth_error';
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.type = 'validation_error';
    this.errors = errors;
  }
}

class ExternalApiError extends AppError {
  constructor(message, provider = 'unknown', details = {}) {
    let statusCode = details.statusCode || 502;
    if (statusCode === 401) statusCode = 502;
    if (details.upstreamStatus === 429) statusCode = 429;

    super(message, statusCode, 'EXTERNAL_API_ERROR');
    this.type = 'external_api_error';
    this.provider = provider;
    this.details = details;
  }
}

class AIProviderError extends ExternalApiError {
  constructor(message, provider = 'unknown', details = {}) {
    super(message, provider, details);
    this.errorCode = 'AI_PROVIDER_ERROR';
  }
}

class PersistenceError extends AppError {
  constructor(message, filename = 'unknown', operation = 'unknown') {
    super(message, 500, 'PERSISTENCE_ERROR');
    this.type = 'database_error';
    this.filename = filename;
    this.operation = operation;
  }
}

class TransitionError extends AppError {
  constructor(message, fromStatus = 'unknown', toStatus = 'unknown') {
    super(message, 400, 'TRANSITION_ERROR');
    this.type = 'validation_error';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

class WorkflowError extends AppError {
  constructor(message, workflowId = 'unknown', step = 'unknown') {
    super(message, 500, 'WORKFLOW_ERROR');
    this.type = 'unknown_error';
    this.workflowId = workflowId;
    this.step = step;
  }
}

class BillingAccessError extends AppError {
  constructor(message = 'Billing access denied', errorCode = 'BILLING_ACCESS_DENIED') {
    super(message, 403, errorCode);
    this.type = 'billing_error';
  }
}

class InsufficientCreditsError extends AppError {
  constructor(message = 'Insufficient credits', details = {}) {
    super(message, 402, 'INSUFFICIENT_CREDITS');
    this.type = 'billing_error';
    this.details = details;
  }
}

module.exports = {
  AppError,
  AuthError,
  ValidationError,
  ExternalApiError,
  AIProviderError,
  PersistenceError,
  TransitionError,
  WorkflowError,
  BillingAccessError,
  InsufficientCreditsError,
};
