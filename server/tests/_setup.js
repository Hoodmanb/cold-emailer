// server/tests/_setup.js
// Global test setup for isolated storage and dummy env vars

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

// Directory containing the original JSON stores
const ORIGINAL_STORAGE = path.resolve(__dirname, '../storage/data');
// Temporary test storage directory (isolated per test run)
const TEST_STORAGE = path.resolve(__dirname, 'tmp');

/**
 * Recursively copies a directory to the test storage location.
 * This is run once before any tests execute.
 */
function copyStorage() {
  if (!fs.existsSync(TEST_STORAGE)) {
    fs.mkdirSync(TEST_STORAGE, { recursive: true });
  }
  const files = fs.readdirSync(ORIGINAL_STORAGE);
  files.forEach((file) => {
    const src = path.join(ORIGINAL_STORAGE, file);
    const dest = path.join(TEST_STORAGE, file);
    fs.copyFileSync(src, dest);
  });
}

/**
 * Resets test storage to a fresh snapshot before each test.
 */
function resetStorage() {
  // Remove existing files in TEST_STORAGE
  if (fs.existsSync(TEST_STORAGE)) {
    const existing = fs.readdirSync(TEST_STORAGE);
    existing.forEach((file) => fs.unlinkSync(path.join(TEST_STORAGE, file)));
  }
  copyStorage();
}

// Export hooks for Node's built‑in test runner
exports.before = async () => {
  console.log('--- Test setup: copying storage to isolated directory ---');
  copyStorage();
};

exports.beforeEach = async () => {
  resetStorage();
};

exports.after = async () => {
  // Cleanup test storage after all tests finish
  if (fs.existsSync(TEST_STORAGE)) {
    const files = fs.readdirSync(TEST_STORAGE);
    files.forEach((file) => fs.unlinkSync(path.join(TEST_STORAGE, file)));
    fs.rmdirSync(TEST_STORAGE);
  }
};
