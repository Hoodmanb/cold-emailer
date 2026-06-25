const cloudinary = require('cloudinary').v2;
const logger = require('./logger');
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
 * @param {Object|string} [options] - Optional upload options, or legacy original filename.
 * @param {string} [options.folder] - Destination folder in Cloudinary.
 * @returns {Promise<Object>} Cloudinary response containing public_id, url, etc.
 */
async function uploadBuffer(buffer, options = {}, _mimeType, legacyFolder) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('uploadBuffer expects a Buffer');
  }

  if (typeof options === 'string') {
    options = {
      folder: legacyFolder,
      filename_override: options,
      use_filename: true,
    };
  }

  const uploadOptions = {
    resource_type: 'raw',
    ...options,
  };

  // Cloudinary's upload_stream works with streams; we wrap the buffer in a stream for simplicity.
  const { Readable } = require('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  console.log('Cloudinary config at runtime:', cloudinary.config());
  console.log('Env vars:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'MISSING',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'MISSING'
  });

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('📸 Cloudinary upload error', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            details: error.details,
          });
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.pipe(upload);
  });
}

async function deleteAsset(publicId, resourceType = 'raw') {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = {
  uploadBuffer,
  deleteAsset,
};
