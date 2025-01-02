const express = require('express')
const categoryRouter = express.Router()

const {
  create, update,
  deleteCategory, getAll,
  getOne} = require('../controller/category.js')

categoryRouter.post('/create', create)

categoryRouter.put('/update', update)

categoryRouter.delete('/delete', deleteCategory)

categoryRouter.get('/getAll', getAll)

categoryRouter.post('/getOne', getOne)

module.exports = categoryRouter;