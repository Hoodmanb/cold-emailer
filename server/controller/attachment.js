const Attachment = require("../models/Attachment.js");
const Joi = require("joi");

exports.create = async (cloudinaryResultObject, userId, isPublic, category = null) => {
  try {
    const newAttachment = await Attachment.create({
      userId,
      name: cloudinaryResultObject.original_filename,
      publicId: cloudinaryResultObject.public_id,
      url: cloudinaryResultObject.secure_url,
      resourceType: cloudinaryResultObject.resource_type,
      format: cloudinaryResultObject.format,
      fileSize: cloudinaryResultObject.bytes,
      isPublic,
      category,
    });

    console.log("✅ Attachment created successfully:", newAttachment);
    return newAttachment;

  } catch (error) {
    console.error("❌ Error creating attachment:", error);
    throw new Error("Attachment creation failed");
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
