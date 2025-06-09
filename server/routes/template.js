const express = require('express')
const templateRouter = express.Router()

const controller = require('../controller/template.js')

templateRouter.post('/', controller.create)

templateRouter.put('/:id', controller.update)

templateRouter.delete('/:id', controller.delete)

templateRouter.get('/', controller.getAll)

templateRouter.post('/:id', controller.getOne)

module.exports = templateRouter;