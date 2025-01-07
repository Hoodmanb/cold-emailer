import React, { useState } from 'react';
import axios from 'axios';
import styles from '../styles/components.module.css';

const AddRecipient = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = '';
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/recipients/create', {
        email,
        name,
        category,
      });

      setMessage(response.data.message);
      console.log(response.data);

      if (response.data.message === 'successful') {
        setEmail('');
        setName('');
        setCategory('');
      }
    } catch (error) {
      console.error('Error creating recipient:', error);
      setMessage('An error occurred while adding the recipient.');
    }
  };

  return (
    <div className= {styles.addRecipient}>
      <h2 className={styles.componentHeader}>Add Recipient</h2>
      {message && <p className={styles.message}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="category">Category:</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.formButton}>
          Add Recipient
        </button>
      </form>
    </div>
  );
};

export default AddRecipient;
