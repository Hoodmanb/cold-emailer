import React, { useState } from 'react';
import axios from 'axios';
import styles from '../styles/components.module.css';

const CreateEmail = () => {
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    body: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });
    
    const recipients = formData.recipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email);

    if (recipients.length === 0) {
      setMessage({ type: 'error', content: 'Please provide at least one recipient.' });
      setLoading(false);
      return;
    }

    try {
      let response;
      if (recipients.length === 1) {
        // Use the /send route for a single recipient
        response = await axios.post('http://localhost:5000/api/email/send', {
          to: recipients[0],
          subject: formData.subject,
          body: formData.body,
        });
      } else {
        // Use the /sendMany route for multiple recipients
        response = await axios.post('http://localhost:5000/api/emails/sendMany', {
          recipients: recipients.map((to) => ({
            to,
            subject: formData.subject,
            body: formData.body,
          })),
        });
      }

      if (response.status === 200) {
        setMessage({ type: 'success', content: response.data.message });
        setFormData({ recipients: '', subject: '', body: '' }); // Reset form
      } else {
        setMessage({ type: 'error', content: response.data.message || 'An error occurred.' });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({
        type: 'error',
        content: error.response?.data?.message || 'Failed to send emails.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.emailForm}>
      <h2 className={styles.componentHeader}>Create Email</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="recipients">Recipients (comma-separated)</label>
          <input
            type="text"
            id="recipients"
            name="recipients"
            placeholder="Enter recipients"
            value={formData.recipients}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Enter email subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="body">Email Body</label>
          <textarea
            id="body"
            name="body"
            placeholder="Write your email here..."
            rows="10"
            value={formData.body}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <button type="submit" className={styles.formButton} disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>

        {message.content && (
          <p
            className={`${styles.responseMessage} ${
              message.type === 'success' ? styles.success : styles.error
            }`}
          >
            {message.content}
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateEmail;
