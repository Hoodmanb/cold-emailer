import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const viewEmail = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSentEmails = async () => {
      try {
        const response = await api.get('/...');// Adjust the endpoint later
        setEmails(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch sent emails.');
      } finally {
        setLoading(false);
      }
    };

    fetchSentEmails();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#3B3030]">Sent Emails</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : emails.length === 0 ? (
        <p className="text-center text-gray-500">No sent emails yet.</p>
      ) : (
        <div className="space-y-4">
          {emails.map((email, index) => (
            <motion.div
              key={email._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border border-gray-200 p-4 rounded-xl bg-[#FAF8F5]"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[#3B3030]">{email.subject}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(email.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                To: <span className="font-medium">{email.to}</span>
              </p>
              <p className="mt-2 text-gray-600 line-clamp-3">{email.body}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default viewEmail;
