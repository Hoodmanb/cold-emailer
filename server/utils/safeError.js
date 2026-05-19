function asErrorMessage(err, fallback = 'Unknown error') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err.message === 'string' && err.message) return err.message;
  return fallback;
}

function toErrorMeta(err) {
  return {
    name: err?.name || 'Error',
    message: asErrorMessage(err),
    stack: err?.stack,
  };
}

module.exports = {
  asErrorMessage,
  toErrorMeta,
};
