// const express = require('express')
// const categoryRouter = express.Router()

// const controller = require('../controller/category.js')

// categoryRouter.post('/', controller.create)

categoryRouter.patch('/:id', controller.update)

// categoryRouter.delete('/:id', controller.delete)

// categoryRouter.get('/', controller.get)

// categoryRouter.get('/:id', controller.getOne)

module.exports = categoryRouter;
