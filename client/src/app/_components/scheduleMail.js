import React, { useState } from 'react';
import axios from 'axios';
import styles from '../styles/components.module.css';

const ScheduleEmail = () => {
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    body: '',
    scheduleDateTime: '', 
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
        response = await axios.post('API_SINGLE_RECIPIENT_ENDPOINT', { //REPLACE WITH CORRECT API ENDPOINT
          to: recipients[0],
          subject: formData.subject,
          body: formData.body,
          scheduleDateTime: formData.scheduleDateTime,
        });
      } else {
        response = await axios.post('API_MULTIPLE_RECIPIENTS_ENDPOINT', { //REPLACE WITH CORRECT API ENDPOINT
          recipients: recipients.map((to) => ({
            to,
            subject: formData.subject,
            body: formData.body,
            scheduleDateTime: formData.scheduleDateTime,
          })),
        });
      }

      if (response.status === 200) {
        setMessage({ type: 'success', content: response.data.message });
        setFormData({ recipients: '', subject: '', body: '', scheduleDateTime: '' });
      } else {
        setMessage({ type: 'error', content: response.data.message || 'An error occurred.' });
      }
    } catch (error) {
      console.error('Error scheduling email:', error);
      setMessage({
        type: 'error',
        content: error.response?.data?.message || 'Failed to schedule emails.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.emailForm}>
      <h2 className={styles.componentHeader}>Schedule An Email</h2>
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

        <div className={styles.formGroup}>
          <label htmlFor="scheduleDateTime">Schedule Date and Time</label>
          <input
            type="datetime-local"
            id="scheduleDateTime"
            name="scheduleDateTime"
            value={formData.scheduleDateTime}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className={styles.formButton} disabled={loading}>
          {loading ? 'Scheduling...' : 'Schedule Email'}
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

export default ScheduleEmail;
