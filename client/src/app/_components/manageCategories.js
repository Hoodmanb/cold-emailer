import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/components.module.css';

const manageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [editName, setEditName] = useState('');

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/category');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Handle adding a new category
  const handleAddCategory = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/category/create', {
        categoryName: newCategory,
      });
      if (response.data.message === 'successful') {
        setCategories([...categories, response.data.newCategory]);
        setNewCategory('');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Handle editing a category
  const handleEditCategory = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/category/update', {
        id: editCategory,
        newData: { category: editName },
      });
      if (response.data.message === 'successful') {
        setCategories(
          categories.map((cat) =>
            cat._id === editCategory ? { ...cat, category: editName } : cat
          )
        );
        setEditCategory(null);
        setEditName('');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (id) => {
    try {
      const response = await axios.delete('http://localhost:5000/api/category/delete', {
        data: { id },
      });
      if (response.data.message === 'Category deleted successfully') {
        setCategories(categories.filter((cat) => cat._id !== id));
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className={styles.manageCategories}>
      <h1 className={styles.componentHeader}>Manage Categories</h1>
      <div className={styles.addCategory}>
        <input
          type="text"
          placeholder="Enter new category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button onClick={handleAddCategory}>Add Category</button>
      </div>
      <table className={styles.categoriesTable}>
        <thead>
          <tr>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category._id}>
              <td>
                {editCategory === category._id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                      className={styles.editCategoryInput}
                  />
                ) : (
                  category.category
                )}
              </td>
              <td>
                {editCategory === category._id ? (
                  <>
                    <button className={styles.savebtn} onClick={handleEditCategory}>Save</button>
                    <button className={styles.cancelbtn} onClick={() => setEditCategory(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditCategory(category._id);
                        setEditName(category.category);
                      }}
                    >
                      Edit
                    </button>
                    <button className={styles.deletebtn} onClick={() => handleDeleteCategory(category._id)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default manageCategories;
