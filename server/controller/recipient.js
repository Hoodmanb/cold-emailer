const Recipient = require('../models/Recipient.js');

// Method to update recipient data using the instance method
const update = async (req, res) => {
  const {email, newData} = req.body
  try {
    const updatedRecipient = await Recipient.update(email, newData);
    console.log('Recipient updated:', recipient);
    res.json(updatedRecipient)
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.json(error)
  }
}

// Method to delete recipient data by email
const deleteRecipient = (req, res) => {
  const email = req.body.email
  try {
    const deletedRecipient = await Recipient.deleteRecipient(email);
    console.log('Recipient deleted');
    res.json(deletedRecipient)
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.json(error)
  }
}

// Creating a new recipient
const create = (req, res) => {
  const {email, name, category} = req.body
  try {
    const newRecipient = await Recipient.createRecipient(email, name, category);
    console.log('New recipient created:', newRecipient);
    res.json(newRecipient)
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.json(error)
  }
}

// Fetching all recipients
const fetchAll = async (req, res) => {
  try {
    const recipients = await Recipient.fetchAll();
    console.log('Fetched all recipients:', recipients);
    res.json(recipients)
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.json(error)
  }
}

const fetchOne = async (req, res) => {
  const email = req.body.email
  try{
    const recipient = Recipient.fetchOne(email)
    console.log(recipient)
    res.json(recipient)
  }catch(error){
    console.log(error)
    res.json(error)
  }
}

module.exports = {
  create, fetchOne
  deleteRecipient,
  update, fetchAll
};