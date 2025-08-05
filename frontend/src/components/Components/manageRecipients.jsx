import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const ManageRecipients = () => {

  const [recipients, setRecipients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editRecipient, setEditRecipient] = useState(null);
  const [tempEditData, setTempEditData] = useState(null);


  const fetchRecipients = async () => {
  try {
    const response = await api.get('/recipient');
    setRecipients(response.data.data);
    setFilteredRecipients(response.data.data);
  } catch (error) {
    console.error('Error fetching recipients:', error);
  }
};


 const fetchCategories = async () => {
  try {
    const response = await api.get('/category');
    setCategories(response.data.data);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};


  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = recipients.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(query) ||
        recipient.email.toLowerCase().includes(query)
    );
    setFilteredRecipients(filtered);
  };


const handleDelete = async (email) => {
  try {
    await api.delete(`/recipient/${email}`);
    const updatedRecipients = recipients.filter((recipient) => recipient.email !== email);
    setRecipients(updatedRecipients);
    setFilteredRecipients(updatedRecipients);
  } catch (error) {
    console.error('Failed to delete recipient:', error);
    alert('Failed to delete recipient. Please try again.');
  }
};


const handleSave = async () => {
  try {
    const response = await api.put(`/recipient/${editRecipient.email}`, tempEditData);

    if (response.data.message === 'Recipient updated successfully') {
      const updatedRecipient = response.data.data;

      const updatedRecipients = recipients.map((r) =>
        r._id === updatedRecipient._id ? updatedRecipient : r
      );

      setRecipients(updatedRecipients);

      const filtered = updatedRecipients.filter((recipient) => {
        const matchCategory =
          selectedCategory === 'All recipients' || recipient.category === selectedCategory;
        const matchSearch =
          recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipient.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      });

      setFilteredRecipients(filtered);
      setEditRecipient(null);
      setTempEditData(null);
    }
  } catch (error) {
    console.error('Failed to update recipient:', error);
    alert('Failed to update recipient');
  }
};


  const handleEdit = (recipient) => {
  setEditRecipient(recipient);
  setTempEditData({ ...recipient });
};



  const handleCancel = () => {
    setEditRecipient(null);
    setTempEditData(null);
  };
  
  useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchRecipients();
      fetchCategories();
    }
  });
  return () => unsubscribe();
}, []);

const handleCategoryChange = (e) => {
  const category = e.target.value;
  setSelectedCategory(category);

  const filtered = recipients.filter((recipient) => {
    const matchCategory =
      category === 'All recipients' || recipient.category === category;
    const matchSearch =
      recipient.name.toLowerCase().includes(searchQuery) ||
      recipient.email.toLowerCase().includes(searchQuery);
    return matchCategory && matchSearch;
  });

  setFilteredRecipients(filtered);
};


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#3B3030]">Manage Recipients</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#795757]"
        />
       <select
        value={selectedCategory}
        onChange={handleCategoryChange}
        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#795757]"
      >
        <option value="All recipients">All recipients</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.category}
          </option>
        ))}
      </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-[#f0e0c6] text-[#3B3030]">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipients.length > 0 ? (
              filteredRecipients.map((recipient) => (
                  <tr key={recipient._id} className="border-t">
                  {editRecipient?._id === recipient._id && tempEditData ? (
                    <>
                      <td className="p-3">
                        <input
                          type="text"
                          value={tempEditData.name}
                          onChange={(e) =>
                            setTempEditData({ ...tempEditData, name: e.target.value })
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="email"
                          value={tempEditData.email}
                          onChange={(e) =>
                            setTempEditData({ ...tempEditData, email: e.target.value })
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={tempEditData.category}
                          onChange={(e) =>
                            setTempEditData({ ...tempEditData, category: e.target.value })
                          }
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#795757]"
                        >
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.category}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={handleSave}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">{recipient.name}</td>
                      <td className="p-3">{recipient.email}</td>
                      <td className="p-3">
                        {categories.find(cat => cat._id === recipient.category)?.category || 'N/A'}
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleEdit(recipient)}
                          className="bg-[#795757] text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(recipient.email)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No recipients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ManageRecipients;
