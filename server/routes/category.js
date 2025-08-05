// const express = require('express')
// const categoryRouter = express.Router()

// const controller = require('../controller/category.js')

// categoryRouter.post('/', controller.create)

// categoryRouter.put('/:id', controller.update)

// categoryRouter.delete('/:id', controller.delete)

// categoryRouter.get('/', controller.get)

// categoryRouter.get('/:id', controller.getOne)

// module.exports = categoryRouter;

const express = require("express");
const categoryRouter = express.Router();
const controller = require("../controller/category.js");

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: API for managing categories
 */

/**
 * @swagger
 * /api/category:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *             properties:
 *               category:
 *                 type: string
 *                 example: Software Engineering
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: category created successful
 *               data:
 *                 _id: 64c93bdbf6e7e5d294cb9b77
 *                 category: Software Engineering
 *       409:
 *         description: Category already exists
 *         content:
 *           application/json:
 *             example:
 *               message: Category already exists.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: error creating category
 *               error: {}
 */
categoryRouter.post("/", controller.create);

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     summary: Update a category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: Marketing
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: category updated successful
 *       400:
 *         description: No new category provided
 *         content:
 *           application/json:
 *             example:
 *               message: No new category provided
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               message: Category not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: error updating category
 *               error: {}
 */
categoryRouter.put("/:id", controller.update);

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               message: Category not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Error deleting category by ID:
 *               error: {}
 */
categoryRouter.delete("/:id", controller.delete);

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: retrieved successfully
 *               data:
 *                 - _id: 64d22a17c3eab0a2b8a8c001
 *                   category: Design
 *                 - _id: 64d22a17c3eab0a2b8a8c002
 *                   category: Software
 *       404:
 *         description: No categories found
 *         content:
 *           application/json:
 *             example:
 *               message: No categories found
 *       500:
 *         description: Error fetching categories
 *         content:
 *           application/json:
 *             example:
 *               message: error fetching categories
 *               error: {}
 */
categoryRouter.get("/", controller.get);

/**
 * @swagger
 * /api/category/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: retrieved successfully
 *               data:
 *                 _id: 64d22a17c3eab0a2b8a8c001
 *                 category: Software
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               message: Category not found
 *       500:
 *         description: Error fetching category
 *         content:
 *           application/json:
 *             example:
 *               message: Error fetching category by ID:
 *               error: {}
 */
// categoryRouter.get("/{id}", controller.getOne);
categoryRouter.get("/:id", controller.getOne);

module.exports = categoryRouter;
