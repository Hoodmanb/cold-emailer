const mongoose = require('mongoose');

// Category Schema
const CategorySchema = new mongoose.Schema({
  category: { type: String, required: true }
});

class categoryClass{
  
  constructor(){
    
  }
  
// Static method to create a new category
static async create(categoryName) {
  try {
    const existingCategory = await this.findOne({ category: categoryName });
    if (existingCategory) {
      return {message: 'Category already exists.'};
    }
    const newCategory = new this({ category: categoryName });
    await newCategory.save();
    return {message:'successful', newCategory};
  } catch (error) {
    console.error('Error creating category:', error);
    return {message:'error creating category', error}
  }
};

// Static method to update category by ID
static async update(id, newData) {
  try {
    const category = await this.findById(id);
    if (!category) {
      return {message:'Category not found'}
    }
    Object.assign(category, newData);
    await category.save();
    return {message:'successful', category};
  } catch (error) {
    console.error('Error updating category by ID:', error);
    return {message:'error updating category', error}
  }
};

// Static method to delete category by ID
static async deleteCategory(id) {
  try {
    const result = await this.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return {message:'Category not found'};
    }
    return { message: 'Category deleted successfully' };
  } catch (error) {
    return {message:'Error deleting category by ID:', error};
  }
};

// Static method to get all categories
static async getAll() {
  try {
    const categories = await this.find({});
    if (categories.length === 0) {
      return {message:'No categories found'};
    }
    return {message:'successful', categorie};
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return {message:'error fetching categories', error}
  }
};

// Static method to get one category by ID
static async getOne(id) {
  try {
    const category = await this.findById(id);
    if (!category) {
      return{message:'Category not found'};
    }
    return {message:'successful', category};
  } catch (error) {
    return {message:'Error fetching category by ID:', error};
    throw error;
  }
};

}

// Create the Category model
CategorySchema.loadClass(categoryClass);
const category = mongoose.model('Category', CategorySchema);
const Category = new category()

// Export models
module.exports = Category;