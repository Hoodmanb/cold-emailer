const Category = require('../models/Category.js');

// Update category
const update = async (req, res) => {
  const {
    id,
    newData
  } = req.body

  try {
    const updatedCategory = await Category.update(id, newData)
    console.log('Category updated:', updatedCategory);
    res.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error);
    res.json(error)
  }
}

const deleteCategory = async (req, res) => {
  const id = req.body.id;
  try {
    const deletecategory = await Category.deleteCategory(id)
    console.log(deletecategory);
    res.json(deletecategory)
  } catch (error) {
    console.error('Error deleting category:', error);
    res.json(error)
  }
}

const create = async (req, res) => {
  const {categoryName} = req.body
  try{
    const newCategory = await Category.create(categoryName)
    res.json(newCategory)
  }catch(error){
    res.json(error)
  }
}

const getAll = async (req, res) => {
  try{
    const categories = await Category.getAll()
    res.json(categories)
  }catch(error){
    res.json(error)
  }
}

const getOne = async (req, res) => {
  const {id} = req.body
  try{
    const category = await Category.getOne(id)
    res.json(category)
  }catch(error){
    res.json(error)
  }
}

module.exports = {
  update, deleteCategory,
  create, getAll, getOne
}