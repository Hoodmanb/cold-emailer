import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

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
        response = await axios.post('http://localhost:5000/api/email/schedule', {
          to: recipients[0],
          subject: formData.subject,
          body: formData.body,
          scheduleDateTime: formData.scheduleDateTime,
        });
      } else {
        response = await axios.post('http://localhost:5000/api/emails/scheduleMany', {
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-2xl"
    >
      <h2 className="text-2xl font-bold text-[#3B3030] mb-6">Schedule an Email</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="recipients" className="block font-semibold mb-1 text-[#3B3030]">
            Recipients (comma-separated)
          </label>
          <input
            type="text"
            id="recipients"
            name="recipients"
            placeholder="Enter recipient emails"
            value={formData.recipients}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#795757] outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="block font-semibold mb-1 text-[#3B3030]">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Enter subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#795757] outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="block font-semibold mb-1 text-[#3B3030]">
            Email Body
          </label>
          <textarea
            id="body"
            name="body"
            rows="8"
            placeholder="Write your email..."
            value={formData.body}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#795757] outline-none"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="scheduleDateTime" className="block font-semibold mb-1 text-[#3B3030]">
            Schedule Date & Time
          </label>
          <input
            type="datetime-local"
            id="scheduleDateTime"
            name="scheduleDateTime"
            value={formData.scheduleDateTime}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#795757] outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-[#795757] text-[#FFF0D1] font-semibold px-6 py-2 rounded-lg shadow hover:bg-[#6a4949] transition"
          disabled={loading}
        >
          {loading ? 'Scheduling...' : 'Schedule Email'}
        </button>

        {message.content && (
          <p
            className={`mt-4 font-medium ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.content}
          </p>
        )}
      </form>
    </motion.div>
  );
};

export default ScheduleEmail;
