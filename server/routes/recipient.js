const express = require('express');
const recipientRouter = express.Router();

const { 
  create, fetchOne,
  deleteRecipient,
  update, fetchAll
} = require('../controller/recipient.js');

recipientRouter.post('/create', create)

recipientRouter.delete('/delete', deleteRecipient)

recipientRouter.put('/update', update)

recipientRouter.post('/fetchone', fetchOne)

recipientRouter.get('/fetchall', fetchAll)

module.exports = recipientRouter;