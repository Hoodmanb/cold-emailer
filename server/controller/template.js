const Template = require("../models/Template.js");

exports.create = async (req, res) => {
  try {
    const newTemplate = new Template.create({ subject, body });
    console.log("Template created successfully:", newTemplate);
    return res.status(200).json({ message: "template created successfully" });
  } catch (error) {
    console.error("Error creating template:", error);
    return res.status(500).json({ message: "error creating template", error });
  }
};

exports.update = async (req, res) => {
  const { newData } = req.body;
  const { id } = req.params;
  try {
    const template = await Template.findById(id);
    if (!template) {
      console.log("Template not found.");
      return res.status(404).json({ message: "template not found" });
    }

    // Update template fields
    Object.assign(template, newData);

    // Save the updated template
    await template.save();
    console.log("Template updated:", template);
    return res.status(200).json({ message: "template updated successfully" });
  } catch (error) {
    console.error("Error updating template by ID:", error);
    return res.status(500).json({ message: "error updating template", error });
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
      return res.status(200).json({ message: "deleted successfully" });
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
      return
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
