const Category = require("../models/Category.js");

// create a new category
exports.create = async (req, res) => {
  try {
    const category = req.body.category;
    const existingCategory = await Category.findOne({ category: category });
    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists." });
    }
    const newCategory = await Category.create({ category: category });
    return res
      .status(201)
      .json({ message: "category created successful", data: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "error creating category", error });
  }
};

// update category by ID
exports.update = async (req, res) => {
  const { id } = req.params;
  const newCategory = req.body.category;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (!newCategory) {
      return res.status(400).json({ message: "No new category provided" });
    }

    if (newCategory) category.category = newCategory;
    await category.save();
    return res.status(200).json({ message: "category updated successful" });
  } catch (error) {
    console.error("Error updating category by ID:", error);
    return res.status(500).json({ message: "error updating category", error });
  }
};

// delete category by ID
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Category.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting category by ID:", error });
  }
};

// get all categories
exports.get = async (req, res) => {
  try {
    const categories = await Category.find({});
    if (categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }
    return res
      .status(200)
      .json({ message: "retrieved successfully", data: categories });
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return res
      .status(500)
      .json({ message: "error fetching categories", error });
  }
};

// get one category by ID
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res
      .status(200)
      .json({ message: "retrieved successfully", data: category });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching category by ID:", error });
  }
};
