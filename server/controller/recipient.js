const Recipient = require("../models/Recipient.js");

exports.update = async (req, res) => {
  const { name, newEmail, category } = req.body;
  console.log(name, newEmail, category);
  const { email } = req.params;

  try {
    const recipient = await Recipient.findOne({ email });
    if (!recipient) {
      console.log("Recipient not found");
      return res.status(404).json({ message: "recipient not found" });
    }

    if (name) recipient.name = name;
    if (newEmail) recipient.email = newEmail;
    if (category) recipient.category = category;

    if (name || newEmail || category) {
      await recipient.save();
      console.log("Recipient updated:", recipient);
      return res
        .status(200)
        .json({ message: "recipient updated successfully" });
    }
    return res.status(400).json({ message: "no data provided" });
  } catch (error) {
    console.error("Error updating recipient by email:", error);
    return res
      .status(500)
      .json({ message: error._message || "error updating recipient", error });
  }
};

// delete recipient data by email
exports.delete = async (req, res) => {
  const { email } = req.params;
  console.log(email);
  try {
    const result = await Recipient.deleteOne({ email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "recipient not found" });
    } else {
      console.log("Recipient deleted successfully.");
      return res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting recipient by email:", error);
    return res.status(500).json({ message: "Error deleting recipient", error });
  }
};

// Creating a new recipient
exports.create = async (req, res) => {
  const { email, name, category } = req.body;
  try {
    // Check if recipient already exists
    const existingRecipient = await Recipient.findOne({ email });
    if (existingRecipient) {
      return res.status(409).json({ message: "recipient already exist" });
    }
    // Create a new recipient
    const newRecipient = await Recipient.create({ email, name, category });
    return res
      .status(200)
      .json({ message: "created successfully", data: newRecipient });
  } catch (error) {
    console.error("Error creating recipient:", error);
    return res.status(500).json({ message: "error creating recipient", error });
  }
};

// Fetching all recipients
exports.get = async (req, res) => {
  try {
    // Retrieve all recipients from the database
    const recipients = await Recipient.find({});
    if (recipients.length === 0) {
      console.log("No recipients found.");
      return res.status(404).json({ message: "no recipient found" });
    }
    console.log("Recipients fetched:", recipients);
    return res
      .status(200)
      .json({ message: "retrieved successfully", data: recipients });
  } catch (error) {
    console.error("Error fetching all recipients:", error);
    return res
      .status(500)
      .json({ message: "error fetching recipients", error });
  }
};

exports.getOne = async (req, res) => {
  const { email } = req.params;
  try {
    // Find recipient by email
    const recipient = await Recipient.findOne({ email });
    if (!recipient) {
      return res.status(404).json({ message: "recipient not found" });
    }
    console.log(recipient);
    return res
      .status(200)
      .json({ message: "retrieved successfully", data: recipient });
  } catch (error) {
    console.error("Error fetching recipient", error);
    return res.status(500).json({ message: "error fetching recipient", error });
  }
};
