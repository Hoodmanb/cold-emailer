const mongoose = require('mongoose');

// Template Schema
const TemplateSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
});

// Template Class
class TemplateClass {
  constructor(subject, body) {
    this.subject = subject;
    this.body = body;
  }

  // Static method to create a new template
  static async create(subject, body) {
    try {
      const newTemplate = new this({ subject, body });
      await newTemplate.save();
      console.log('Template created successfully:', newTemplate);
      return {message:'successful', newTemplate};
    } catch (error) {
      console.error('Error creating template:', error);
      return {message:'error creating template', error}
    }
  }

  // Static method to update a template by ID
  static async update(id, newData) {
    try {
      const template = await this.findById(id);
      if (!template) {
        console.log('Template not found.');
        return {message:'template not found'};
      }

      // Update template fields
      Object.assign(template, newData);

      // Save the updated template
      await template.save();
      console.log('Template updated:', template);
      return {message:'successful', template};
    } catch (error) {
      console.error('Error updating template by ID:', error);
      return {message:'error updating template', error}
    }
  }

  // Static method to delete a template by ID
  static async deleteTemplate(id) {
    try {
      const result = await this.findByIdAndDelete(id);
      if (!result) {
        console.log('No template found with the provided ID.');
        return {message:'no template found'}
      } else {
        console.log('Template deleted successfully:', result);
        return {message:'successful', result}
      }
    } catch (error) {
      console.error('Error deleting template by ID:', error);
      return {message:'error deleting template', error}
    }
  }

  // Static method to fetch all templates
  static async fetchAll() {
    try {
      const templates = await this.find({});
      if (templates.length === 0) {
        console.log('No templates found.');
        return {message:'No template found'};
      }
      console.log('Templates fetched:', templates);
      return {message:'successful', templates};
    } catch (error) {
      console.error('Error fetching all templates:', error);
      return {message:'error fetching templates', error}
    }
  }
  
  // Static method to fetch a template by ID
  static async fetchTemplateById(id) {
    try {
      const template = await this.findById(id);
      if (!template) {
        console.log('No template found with the provided ID.');
        return {message:'No template found'};
      }
      console.log('Template fetched:', template);
      return {message:'successful', template};
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      return {message:'error fetching template', error}
    }
  }
}

// Load the class into the schema
TemplateSchema.loadClass(TemplateClass);

// Create and export the Template model
const template = mongoose.model('Template', TemplateSchema);
const Template = new template()

module.exports = Template;