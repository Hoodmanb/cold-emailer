/**
 * @param {string} base64
 * @returns {Buffer}
 */
function base64ToBuffer(base64) {
  if (base64 == null || typeof base64 !== 'string') {
    throw new Error('Invalid base64 payload');
  }
  return Buffer.from(base64, 'base64');
}

module.exports = { base64ToBuffer };
