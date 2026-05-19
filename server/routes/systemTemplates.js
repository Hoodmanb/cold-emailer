const express = require('express');
const router = express.Router();
const { getRegistry } = require('../services/document/documentEngine');

router.get('/', (req, res) => {
  try {
    const registry = getRegistry();
    // Return all metadata
    return res.status(200).json({
      message: 'retrieved successfully',
      data: registry
    });
  } catch (error) {
    console.error('Error fetching system templates:', error);
    return res.status(500).json({ message: 'Error fetching templates' });
  }
});

module.exports = router;
