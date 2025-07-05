const Attachment = require("../models/Attachment.js");
const Joi = require("joi");
const { validateRequest } = require("../utils/validateRequest.js");

exports.create = async (req, res) => {
  const { name, isPublic, url } = req.body;
  const userId = req.userId;

  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.empty": "name is required",
    }),
    url: Joi.string().required().messages({
      "string.empty": "url is required",
    }),
  }).unknown(true);
  
  const { isValid, errors } = validateRequest(schema, req.body);

  if (!isValid) {
    return res.status(400).json({ message: "validation error", errors });
  }

  try {
    const newAttachment = await Attachment.create({
      userId,
      name,
      isPublic,
      url,
    });
    console.log("attachment created successfully:", newAttachment);
    return res.status(200).json({ message: "attachment created successfully" });
  } catch (error) {
    console.error("Error creating attachment:", error);
    return res
      .status(500)
      .json({ message: "error creating attachment", error });
  }
};

exports.update = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      console.log("Attachment not found.");
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (name !== undefined) attachment.name = name;

    // Save the updated template
    await attachment.save();
    console.log("attachment updated:", attachment);
    return res.status(200).json({ message: "attachment updated successfully" });
  } catch (error) {
    console.error("Error updating attachment by ID:", error);
    return res
      .status(500)
      .json({ message: "error updating attachment", error });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Attachment.findByIdAndDelete(id);
    if (!result) {
      console.log("No attachment found with the provided ID.");
      return res.status(404).json({ message: "no attachment found" });
    } else {
      console.log("attachment deleted successfully:", result);
      return res.status(200).json({ message: "deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting attachment by ID:", error);
    return res
      .status(500)
      .json({ message: "error deleting attachment", error });
  }
};

exports.getAll = async (req, res) => {
  try {
    const attachments = await Attachment.find({});
    if (attachments.length === 0) {
      console.log("No attachments found.");
      return res.status(404).json({ message: "No attachments found" });
    }
    console.log("attachments fetched:", attachments);
    res
      .status(200)
      .json({ message: "retrieved successfully", data: attachments });
    return;
  } catch (error) {
    console.error("Error fetching all attachments:", error);
    return res
      .status(500)
      .json({ message: "error fetching attachments", error });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const attachments = await Attachments.findById(id);
    if (!attachments) {
      console.log("No attachments found with the provided ID.");
      return res.status(404).json({ message: "No attachments found" });
    }
    console.log("attachments fetched:", attachments);
    res
      .status(200)
      .json({ message: "retrieved successfully", data: attachments });
  } catch (error) {
    console.error("Error fetching attachments by ID:", error);
    return res
      .status(500)
      .json({ message: "error fetching attachments", error });
  }
};
