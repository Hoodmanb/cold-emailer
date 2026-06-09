const express = require('express');
const { uploadFile, listUploads, deleteUpload, downloadUpload, previewUpload } = require('./controller');
const router = express.Router();

// Upload a file (multipart/form-data)
router.post('/', uploadFile);

// List uploaded documents for the authenticated user
router.get('/', listUploads);

// Delete an uploaded document by ID
router.delete('/:id', deleteUpload);

// Preview an uploaded document inline
router.get('/:id/preview', previewUpload);

// Download an uploaded document (force download)
router.get('/:id/download', downloadUpload);

module.exports = router;
