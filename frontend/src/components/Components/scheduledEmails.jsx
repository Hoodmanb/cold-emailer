import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Eye } from 'lucide-react';

const scheduledEmails = () => {
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Sample data
  useEffect(() => {
    setScheduledEmails([
      {
        _id: '1',
        to: 'team@company.com',
        subject: 'Weekly Standup',
        body: 'Reminder: Weekly standup is scheduled for Monday at 9AM. Please be on time.',
        scheduledFor: '2025-08-05T09:00:00Z',
      },
      {
        _id: '2',
        to: 'user@example.com',
        subject: 'Project Update',
        body: 'Hi, just checking in on the status of the project. Can you send updates by Thursday?',
        scheduledFor: '2025-08-07T14:30:00Z',
      },
    ]);
  }, []);

  const handleEdit = (email) => {
    alert(`Editing email to: ${email.to}`);
    // Ideally, open a modal or redirect to edit page with pre-filled form
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this scheduled email?')) {
      setScheduledEmails((prev) => prev.filter((email) => email._id !== id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#3B3030]">Scheduled Emails</h2>

      {scheduledEmails.length === 0 ? (
        <p className="text-center text-gray-500">No emails scheduled.</p>
      ) : (
        <div className="space-y-4">
          {scheduledEmails.map((email, index) => (
            <motion.div
              key={email._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 p-4 rounded-xl bg-[#FAF8F5] relative"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#3B3030]">{email.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    To: <span className="font-medium">{email.to}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Scheduled for:{' '}
                    {new Date(email.scheduledFor).toLocaleString()}
                  </p>
                  <p className="mt-2 text-gray-700 line-clamp-3">{email.body}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button
                    onClick={() => setSelectedEmail(email)}
                    className="text-blue-600 hover:text-blue-800"
                    title="View Full"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(email)}
                    className="text-green-600 hover:text-green-800"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(email._id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View full email modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full relative">
            <button
              onClick={() => setSelectedEmail(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-[#3B3030] mb-2">
              {selectedEmail.subject}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              To: <span className="font-medium">{selectedEmail.to}</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Scheduled for:{' '}
              {new Date(selectedEmail.scheduledFor).toLocaleString()}
            </p>
            <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.body}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default scheduledEmails;
