/**
 * Utility helpers for normalizing JSON store shapes.
 * All stores in the application are standardized as plain arrays.
 */

/**
 * Ensure the provided data is an array.
 * If the data is an object with a `data` property (legacy scoped format),
 * returns the value of that property. If the data is an object without `data`,
 * returns an empty array. Otherwise returns the original array.
 *
 * @param {*} data - The raw JSON data read from disk.
 * @returns {Array} Normalized array.
 */
function ensureArray(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) {
      return data.data;
    }
    // Return the first array property if present (legacy scoped format)
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
    return [];
  }
  return [];
}

module.exports = { ensureArray };
