import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';



console.log(`api:${api}`)

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [editName, setEditName] = useState('');


  //GET
useEffect(() => {
  const auth = getAuth();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Logged in user:", user);

      try {
        const response = await api.get('/category');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    } else {
      console.warn('No user logged in');
    }
  });

  return () => unsubscribe();
}, []);



//POST
  const handleAddCategory = async () => {
  if (!newCategory.trim()) return;

  try {
    const response = await api.post('/category/create', {
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


//PUT
  const handleEditCategory = async () => {
  if (!editName.trim()) return;

  try {
    const response = await api.put('/category/update', {
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


//DELETE
  const handleDeleteCategory = async (id) => {
  try {
    const response = await api.delete('/category/delete', {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#3B3030]">Manage Categories</h2>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Enter new category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-[#795757] focus:ring-2"
        />
        <button
          onClick={handleAddCategory}
          className="bg-[#795757] text-[#FFF0D1] px-5 py-2 rounded-lg hover:bg-[#6a4949] transition"
        >
          Add
        </button>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#f0e0c6] text-[#3B3030]">
            <th className="p-3 font-semibold">Category</th>
            <th className="p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category._id} className="border-b">
              <td className="p-3">
                {editCategory === category._id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                ) : (
                  category.category
                )}
              </td>
              <td className="p-3">
                {editCategory === category._id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditCategory}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditCategory(null)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditCategory(category._id);
                        setEditName(category.category);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default ManageCategories;
