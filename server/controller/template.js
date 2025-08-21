const Template = require("../models/Template.js");
const Joi = require("joi");
const { validateRequest } = require("../utils/validateRequest.js");
const upload = require("../lib/multer.js")
const uploadToCloudinary = require("../utils/uplopadToCloudinary.js")
const { create } = require("../controller/attachment.js")

exports.create = [
  // upload.single('attachment'),
  async (req, res) => {
    const { name, subject, body, isPublic } = req.body;
    const userId = req.userId;
    const valuesToValidate = { name, subject, body, isPublic };

    const schema = Joi.object({
      name: Joi.string().required().messages({
        "string.empty": "name is required",
      }),
      body: Joi.string().min(10).required().messages({
        "string.empty": "body is required",
        "string.min": "body must be at least 10 characters",
      }),
      // subject: Joi.string().required().messages({
      //   "string.empty": "subject is required",
      // }),

    }).unknown(true);

    const { error: bodyError } = schema.validate(valuesToValidate);

    if (bodyError) {
      return res.status(400).json({ message: "validation error", errors: bodyError.details });
    }

    // If file is optional, only validate when it exists
    if (req.file) {
      const fileSchema = Joi.object({
        originalname: Joi.string().required(),
        mimetype: Joi.string().valid(
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/vnd.oasis.opendocument.text'
        ).required(),
        buffer: Joi.binary().required(),
        size: Joi.number().max(5 * 1024 * 1024).messages({
          "number.max": "File must not be larger than 5MB",
        }),
      }).unknown(true);;

      const { error: fileError } = fileSchema.validate(req.file);

      if (fileError) {
        return res.status(400).json({ message: "validation error", errors: fileError.details });
      }
    }


    try {
      console.log("there is a file here")
      if (req.file) {
        console.log("there is a file")
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'my_files');
        await create(cloudinaryResult, userId, isPublic)
      }
      const newTemplate = await Template.create({
        userId,
        subject,
        body,
        name,
        isPublic
      });
      return res.status(200).json({ message: "template created successfully" });
    } catch (error) {
      console.error("Error creating template:", error);
      return res.status(500).json({ message: "error creating template", error });
    }
  }];

exports.update = async (req, res) => {
  const { subject, body, name, isPublic, url } = req.body;
  const { id } = req.params;
  console.log(req.body)
  try {
    const template = await Template.findById(id);
    if (!template) {
      console.log("Template not found.");
      return res.status(404).json({ message: "Template not found" });
    }

    // Update only fields provided in the request
    if (subject !== undefined) template.subject = subject;
    if (body !== undefined) template.body = body;
    if (name !== undefined) template.name = name;
    if (isPublic !== undefined) template.isPublic = isPublic;
    if (url !== undefined) template.url = url;

    await template.save();

    console.log("Template updated:", template);
    return res.status(200).json({
      message: "Template updated successfully",
      template,
    });
  } catch (error) {
    console.error("Error updating template by ID:", error);
    return res.status(500).json({
      message: "Error updating template",
      error: error.message,
    });
  }
};


exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Template.findByIdAndDelete(id);
    if (!result) {
      console.log("No template found with the provided ID.");
      return res.status(404).json({ message: "no template found" });
    } else {
      console.log("Template deleted successfully:", result);
      return res.status(204)
    }
  } catch (error) {
    console.error("Error deleting template by ID:", error);
    return res.status(500).json({ message: "error deleting template", error });
  }
};

exports.getAll = async (req, res) => {
  try {
    const templates = await Template.find({});
    if (templates.length === 0) {
      console.log("No templates found.");
      return res.status(404).json({ message: "No template found" });
    }
    console.log("Templates fetched:", templates);
    res
      .status(200)
      .json({ message: "retrieved successfully", data: templates });
    return;
  } catch (error) {
    console.error("Error fetching all templates:", error);
    return res.status(500).json({ message: "error fetching templates", error });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const template = await Template.findById(id);
    if (!template) {
      console.log("No template found with the provided ID.");
      return res.status(404).json({ message: "No template found" });
    }
    console.log("Template fetched:", template);
    res.status(200).json({ message: "retrieved successfully", data: template });
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    return res.status(500).json({ message: "error fetching template", error });
  }
};
