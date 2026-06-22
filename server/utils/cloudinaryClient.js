const cloudinary = require('cloudinary').v2;

// Validate Cloudinary configuration at module load time
const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  // Fail fast – the server will error on startup if Cloudinary is not configured
  throw new Error(`Cloudinary configuration missing: ${missing.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a Buffer (e.g. from multer memory storage) to Cloudinary.
 * @param {Buffer} buffer - Binary data to upload.
 * @param {Object} [options] - Optional upload options.
 * @param {string} [options.folder] - Destination folder in Cloudinary.
 * @returns {Promise<Object>} Cloudinary response containing public_id, url, etc.
 */
async function uploadBuffer(buffer, options = {}) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('uploadBuffer expects a Buffer');
  }

  // Cloudinary's upload_stream works with streams; we wrap the buffer in a stream for simplicity.
  const { Readable } = require('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: options.folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.pipe(upload);
  });
}

module.exports = {
  uploadBuffer,
};
