const streamifier = require('streamifier');
const cloudinary = require("../lib/cloudinary");

/**
 * Uploads a file buffer to Cloudinary using a preset and dynamic folder path.
 * 
 * @param {Buffer} buffer - File buffer (from multer memoryStorage).
 * @param {string} preset - Upload preset name from Cloudinary dashboard.
 * @param {string} [userId] - Optional user ID to generate subfolder.
 * @param {boolean} [isPublic=false] - Whether the file should be publicly accessible.
 * @returns {Promise<Object>} - Cloudinary upload result object.
 */

const uploadToCloudinary = (buffer, preset = 'attachments_upload', userId, isPublic = false) => {
  const folder = userId
    ? `attachments/users/${userId}`
    : 'attachments/default';

  const options = {
    folder,
    ...(isPublic ? {} : { access_mode: 'authenticated' }), // 🔥 only include if private
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = uploadToCloudinary;
