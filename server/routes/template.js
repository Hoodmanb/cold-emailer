const express = require('express')
const templateRouter = express.Router()

const {
  create, update,
  deleteTemplate, getAll,
  getOne} = require('../controller/template.js')

templateRouter.post('/create', create)

templateRouter.put('/update', update)

templateRouter.delete('/delete', deleteTemplate)

templateRouter.get('/getAll', getAll)

templateRouter.post('/getOne', getOne)

module.exports = templateRouter;