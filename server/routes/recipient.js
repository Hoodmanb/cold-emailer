// const express = require("express");
// const recipientRouter = express.Router();

// const controller = require("../controller/recipient.js");

// recipientRouter.post("/", controller.create);

// recipientRouter.delete("/:email", controller.delete);

// recipientRouter.put("/:email", controller.update);

// recipientRouter.get("/:email", controller.getOne);

// recipientRouter.get("/", controller.get);

// module.exports = recipientRouter;

const express = require("express");
const recipientRouter = express.Router();
const controller = require("../controller/recipient.js");

/**
 * @swagger
 * tags:
 *   name: Recipient
 *   description: API for managing email recipients
 */

/**
 * @swagger
 * /api/recipient:
 *   post:
 *     summary: Create a new recipient
 *     tags: [Recipient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               category:
 *                 type: string
 *                 example: 64d22a17c3eab0a2b8a8c001
 *     responses:
 *       200:
 *         description: Recipient created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: created successfully
 *               data:
 *                 _id: 64e4f123abc4567890cde123
 *                 name: John Doe
 *                 email: johndoe@example.com
 *                 category: 64d22a17c3eab0a2b8a8c001
 *       400:
 *         description: Validation or field error
 *         content:
 *           application/json:
 *             example:
 *               message: field error
 *               errors:
 *                 email: email already exist
 *                 name: name already exist
 *                 category: category not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: error creating recipient
 *               error: {}
 */
recipientRouter.post("/", controller.create);

/**
 * @swagger
 * /api/recipient/{email}:
 *   delete:
 *     summary: Delete a recipient by email
 *     tags: [Recipient]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The recipient's email address
 *     responses:
 *       204:
 *         description: Recipient deleted successfully
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             example:
 *               message: recipient not found
 *       500:
 *         description: Error deleting recipient
 *         content:
 *           application/json:
 *             example:
 *               message: Error deleting recipient
 *               error: {}
 */
recipientRouter.delete("/:email", controller.delete);

/**
 * @swagger
 * /api/recipient/{email}:
 *   put:
 *     summary: Update a recipient by email
 *     tags: [Recipient]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The recipient's current email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               newEmail:
 *                 type: string
 *                 example: janedoe@example.com
 *               category:
 *                 type: string
 *                 example: 64d22a17c3eab0a2b8a8c001
 *     responses:
 *       200:
 *         description: Recipient updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: recipient updated successfully
 *       400:
 *         description: No data provided
 *         content:
 *           application/json:
 *             example:
 *               message: no data provided
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             example:
 *               message: recipient not found
 *       500:
 *         description: Error updating recipient
 *         content:
 *           application/json:
 *             example:
 *               message: error updating recipient
 *               error: {}
 */
recipientRouter.put("/:email", controller.update);

/**
 * @swagger
 * /api/recipient/{email}:
 *   get:
 *     summary: Get a single recipient by email
 *     tags: [Recipient]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The recipient's email
 *     responses:
 *       200:
 *         description: Recipient retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: retrieved successfully
 *               data:
 *                 _id: 64e4f123abc4567890cde123
 *                 name: John Doe
 *                 email: johndoe@example.com
 *                 category: 64d22a17c3eab0a2b8a8c001
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             example:
 *               message: recipient not found
 *       500:
 *         description: Error fetching recipient
 *         content:
 *           application/json:
 *             example:
 *               message: error fetching recipient
 *               error: {}
 */
recipientRouter.get("/:email", controller.getOne);

/**
 * @swagger
 * /api/recipient:
 *   get:
 *     summary: Get all recipients
 *     tags: [Recipient]
 *     responses:
 *       200:
 *         description: Recipients retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: retrieved successfully
 *               data:
 *                 - _id: 64e4f123abc4567890cde123
 *                   name: John Doe
 *                   email: johndoe@example.com
 *                   category: 64d22a17c3eab0a2b8a8c001
 *                 - _id: 64e4f123abc4567890cde124
 *                   name: Jane Smith
 *                   email: janesmith@example.com
 *                   category: 64d22a17c3eab0a2b8a8c001
 *       404:
 *         description: No recipients found
 *         content:
 *           application/json:
 *             example:
 *               message: no recipient found
 *       500:
 *         description: Error fetching recipients
 *         content:
 *           application/json:
 *             example:
 *               message: error fetching recipients
 *               error: {}
 */
recipientRouter.get("/", controller.get);

module.exports = recipientRouter;
