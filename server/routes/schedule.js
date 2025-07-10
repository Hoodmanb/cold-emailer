// const express = require("express");
// const router = express.Router();
// const controller = require("../controller/schedule");

// router.post("/", controller.create);

// router.post("/:id/recipients", controller.addRecipient);

// router.get("/", controller.get);

// router.put("/:id", controller.update);

// router.delete("/:id", controller.delete);

// module.exports = router;


const express = require("express");
const router = express.Router();
const controller = require("../controller/schedule");

/**
 * @swagger
 * tags:
 *   name: Schedule
 *   description: API for managing email schedules
 */

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - frequency
 *               - day
 *               - hour
 *               - template
 *             properties:
 *               name:
 *                 type: string
 *                 example: Weekly Followup
 *               frequency:
 *                 type: string
 *                 enum: [weekly, monthly]
 *                 example: weekly
 *               day:
 *                 type: number
 *                 example: 3
 *               hour:
 *                 type: number
 *                 example: 14
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: test@example.com
 *               template:
 *                 type: object
 *                 required:
 *                   - subject
 *                   - body
 *                 properties:
 *                   subject:
 *                     type: string
 *                     example: Hello!
 *                   body:
 *                     type: string
 *                     example: Just checking in...
 *     responses:
 *       201:
 *         description: Schedule created
 *         content:
 *           application/json:
 *             example:
 *               message: Schedule created
 *               schedule: {}
 *       400:
 *         description: Missing required main template
 *         content:
 *           application/json:
 *             example:
 *               message: Main template (subject and body) is required.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: {}
 */
router.post("/", controller.create);

/**
 * @swagger
 * /api/schedule/{id}/recipients:
 *   post:
 *     summary: Add a recipient to a schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userId
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               userId:
 *                 type: string
 *                 example: 123abc456
 *     responses:
 *       201:
 *         description: Recipient added successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Recipient added successfully
 *       400:
 *         description: Recipient already exists
 *         content:
 *           application/json:
 *             example:
 *               message: Recipient already exists
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: you dont have access to this data
 *       404:
 *         description: Schedule not found
 *         content:
 *           application/json:
 *             example:
 *               message: Schedule not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: {}
 */
router.post("/:id/recipients", controller.addRecipient);

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Get all schedules by user
 *     tags: [Schedule]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 123abc456
 *     responses:
 *       200:
 *         description: Fetched
 *         content:
 *           application/json:
 *             example:
 *               message: Fetched
 *               schedules: []
 *       404:
 *         description: No schedules found
 *         content:
 *           application/json:
 *             example:
 *               message: No schedules found
 *       500:
 *         description: Error fetching schedules
 *         content:
 *           application/json:
 *             example:
 *               message: Error fetching schedules
 *               error: {}
 */
router.get("/", controller.get);

/**
 * @swagger
 * /api/schedule/{id}:
 *   put:
 *     summary: Update a schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 123abc456
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             example:
 *               message: Updated
 *               schedule: {}
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: you dont have access to this data
 *       500:
 *         description: Error updating schedule
 *         content:
 *           application/json:
 *             example:
 *               message: Error updating schedule
 *               error: {}
 */
router.put("/:id", controller.update);

/**
 * @swagger
 * /api/schedule/{id}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 123abc456
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             example:
 *               message: Deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: you dont have access to this data
 *       500:
 *         description: Error deleting schedule
 *         content:
 *           application/json:
 *             example:
 *               message: Error deleting schedule
 *               error: {}
 */
router.delete("/:id", controller.delete);

module.exports = router;
