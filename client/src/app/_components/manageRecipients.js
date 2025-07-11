import React, { useState } from 'react';
import styles from '../styles/components.module.css';

const manageRecipients = () => {
  const [recipients, setRecipients] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', category: 'Technology' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', category: 'Health' },
    { id: 3, name: 'Sam Wilson', email: 'sam.wilson@example.com', category: 'Education' },
    { id: 4, name: 'Emily Johnson', email: 'emily.johnson@example.com', category: 'Technology' },
    { id: 5, name: 'Michael Brown', email: 'michael.brown@example.com', category: 'Health' },
  ]);

  const [filteredRecipients, setFilteredRecipients] = useState(recipients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editRecipient, setEditRecipient] = useState(null);
  const [tempEditData, setTempEditData] = useState(null);

  const categories = ['All Categories', 'Technology', 'Health', 'Education'];

  // Handle search
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

  // Handle category filter
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);

    if (category === 'All Categories') {
      setFilteredRecipients(
        recipients.filter((recipient) =>
          recipient.name.toLowerCase().includes(searchQuery) ||
          recipient.email.toLowerCase().includes(searchQuery)
        )
      );
    } else {
      setFilteredRecipients(
        recipients.filter(
          (recipient) =>
            recipient.category === category &&
            (recipient.name.toLowerCase().includes(searchQuery) ||
              recipient.email.toLowerCase().includes(searchQuery))
        )
      );
    }
  };

  // Handle delete action
  const handleDelete = (id) => {
    const updatedRecipients = recipients.filter((recipient) => recipient.id !== id);
    setRecipients(updatedRecipients);
    setFilteredRecipients(updatedRecipients);
  };

  // Handle edit action
  const handleEdit = (recipient) => {
    setEditRecipient(recipient);
    setTempEditData({ ...recipient });
  };

  // Handle save action
  const handleSave = () => {
    const updatedRecipients = recipients.map((recipient) =>
      recipient.id === editRecipient.id ? tempEditData : recipient
    );
    setRecipients(updatedRecipients);
    setFilteredRecipients(updatedRecipients);
    setEditRecipient(null);
    setTempEditData(null);
  };

  // Handle cancel action
  const handleCancel = () => {
    setEditRecipient(null);
    setTempEditData(null); 
  };

  return (
    <div className={styles.manageRecipients}>
      <h2 className={styles.componentHeader}>Manage Recipients</h2>

      <div>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.input}
          />
        </div>

        {/* Category Filter */}
        <div className={styles.filter}>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className={styles.input}
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recipients Table */}
      <table className={styles.recipientsTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecipients.length > 0 ? (
            filteredRecipients.map((recipient) => (
              <tr key={recipient.id}>
                {editRecipient?.id === recipient.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={tempEditData.name}
                        onChange={(e) =>
                          setTempEditData({ ...tempEditData, name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={tempEditData.email}
                        onChange={(e) =>
                          setTempEditData({ ...tempEditData, email: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={tempEditData.category}
                        onChange={(e) =>
                          setTempEditData({ ...tempEditData, category: e.target.value })
                        }
                      >
                        {categories.slice(1).map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={handleSave}
                        className={`${styles.actionButton} ${styles.saveButton}`}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{recipient.name}</td>
                    <td>{recipient.email}</td>
                    <td>{recipient.category || 'N/A'}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(recipient)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(recipient.id)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
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
              <td colSpan="4">No recipients found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default manageRecipients;