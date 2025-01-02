const Template = require('../models/Template.js');

const create = async (req, res) => {
  const { subject, body } = req.body;
  try {
    const template = await Template.create(subject, body);
    res.json(template)
  } catch (error) {
    res.json(error)
  }
};

const update = async (req, res) => {
  const {id, newData} = req.body;
  try {
    const updatedTemplate = await Template.update(id, newData);
    res.json(updatedTemplate)
  } catch (error) {
    res.json(error)
  }
};

const deleteTemplate = async (req, res) => {
  const { id } = req.body;
  try {
    const deletedTemplate = await Template.deleteTemplate(id);
    res.json(deletedTemplate)
  } catch (error) {
    res.json(error)
  }
};

const getAll = async (req, res) => {
  try {
    const templates = await Template.fetchAll();
    res.json(templates);
  } catch (error) {
    res.json(error)
  }
};

const getOne = async (req, res) => {
  const { id } = req.body;
  try {
    const template = await Template.fetchOne(id);
    res.json(template );
  } catch (error) {
    res.json(error)
  }
};

module.exports = {
  create,
  update,
  deleteTemplate,
  getAll,
  getOne
};