function debugLog(message, meta) {
  const timestamp = new Date().toISOString();
  const line = `[DEBUG][${timestamp}] ${message} ${meta ? JSON.stringify(meta) : ""}`;
  console.error(line);
}

module.exports = debugLog;
