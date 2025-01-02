const mongoose = require('mongoose');

// Recipient Schema
const RecipientSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
});

// Recipient Class
class RecipientClass {
  constructor(email, name, category) {
    this.email = email;
    this.name = name;
    this.category = category || "";
  }

  // Static method to update recipient by email
  static async update(email, newData) {
    try {
      // Find recipient by email
      const recipient = await this.findOne({ email });
      if (!recipient) {
        console.log('Recipient not found');
        return {message:'recipient not found'}
      }

      // Update recipient fields with new data
      Object.assign(recipient, newData);

      // Save the updated recipient
      await recipient.save();
      console.log('Recipient updated:', recipient);
      return {message:'successful', recipient}
    } catch (error) {
      console.error('Error updating recipient by email:', error);
      return {message:'error updating recipient', error}
    }
  }

  // Method to delete recipient by email
  static async deleteRecipient(email) {
    try {
      const result = await this.deleteOne({ email });
      if (result.deletedCount === 0) {
        console.log('No recipient found with the provided email.');
        return {message:'recipient not found'}
      } else {
        console.log('Recipient deleted successfully.');
        return {message:'successful'}
      }
    } catch (error) {
      console.error('Error deleting recipient by email:', error);
      return {message:'Error deleting recipient', error}
    }
  }

  // Static method to create a new recipient
  static async create(email, name, category) {
    try {
      // Check if recipient already exists
      const existingRecipient = await this.findOne({ email });
      if (existingRecipient) {
        console.log('Recipient with this email already exists.');
        return {message:'recipient already exist'};
      }

      // Create a new recipient
      const newRecipient = new this({ email, name, category });
      await newRecipient.save();
      console.log('Recipient created successfully:', newRecipient);
      return {message:'successful', newRecipient};
    } catch (error) {
      console.error('Error creating recipient:', error);
      return {message:'error creating recipient', error}
    }
  }

  // Static method to fetch all recipients
  static async fetchAll() {
    try {
      // Retrieve all recipients from the database
      const recipients = await this.find({});
      if (recipients.length === 0) {
        console.log('No recipients found.');
        return {message:'no recipient found'}
      }
      console.log('Recipients fetched:', recipients);
      return {message:'successful', recipients};
    } catch (error) {
      console.error('Error fetching all recipients:', error);
      return {message:'error fetching recipients'}
    }
  }
  
  static async fetchOne(email) {
    try {
      // Find recipient by email
      const recipient = await this.findOne({ email });
      if (!recipient) {
        console.log('Recipient not found');
        return {message:'recipient not found'}
      }
      console.log(recipient)
      return {message:'successful', recipient}
    } catch (error) {
      console.error('Error fetching recipient', error);
      return {message:'error fetching recipient', error}
    }
  }
}

// Create the Recipient model
RecipientSchema.loadClass(RecipientClass);
const recipient = mongoose.model('Recipient', RecipientSchema);
const Recipient = new recipient()

// Export models
module.exports = Recipient;