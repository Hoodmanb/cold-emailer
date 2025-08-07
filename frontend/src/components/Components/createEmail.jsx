import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';


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
      response = await api.post('/email/send', {
        to: recipients[0],
        subject: formData.subject,
        body: formData.body,
      });
    } else {
      const auth = getAuth();
      const user = auth.currentUser;
      const senderEmail = user?.email;

      const payload = {
        email: senderEmail,
        emails: recipients.map((to) => ({
          to,
          subject: formData.subject,
          body: formData.body,
        })),
      };

      console.log("Payload to /send/bulk:", payload);

      response = await api.post('/email/send/bulk', payload);
    }

    if (response.status === 200) {
      setMessage({ type: 'success', content: response.data.message });
      setFormData({ recipients: '', subject: '', body: '' });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#3B3030]">Create Email</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="recipients" className="block font-medium mb-1">Recipients (comma-separated)</label>
          <input
            type="text"
            id="recipients"
            name="recipients"
            value={formData.recipients}
            onChange={handleChange}
            placeholder="e.g. user@example.com, team@company.com"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#795757]"
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="block font-medium mb-1">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Enter email subject"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#795757]"
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="block font-medium mb-1">Email Body</label>
          <textarea
            id="body"
            name="body"
            rows="8"
            value={formData.body}
            onChange={handleChange}
            placeholder="Write your email..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#795757]"
            required
          ></textarea>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          type="submit"
          className="w-full bg-[#795757] text-[#FFF0D1] py-3 rounded-xl font-semibold hover:bg-[#6a4949] transition"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </motion.button>

        {message.content && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center mt-4 font-medium ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.content}
          </motion.p>
        )}
      </form>
    </motion.div>
  );
};

export default CreateEmail;
