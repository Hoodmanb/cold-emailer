import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../../utils/api';
import { motion } from 'framer-motion';

const AddRecipient = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCategories();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/category');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
>>>>>>> c4175b54c3950c642b4ff01ec96161ade53796db

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await api.post('/recipient', {
        email,
        name,
        category,
      });

      setMessage(response.data.message);

      if (response.data.message === 'created successfully') {
        setEmail('');
        setName('');
        setCategory('');

        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error creating recipient:", error);
      setMessage("An error occurred while adding the recipient.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mt-6 mx-auto bg-white p-6 rounded-2xl shadow-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#3B3030]">Add Recipient</h2>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mb-4 text-center font-medium ${
            message === "successful" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </motion.p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#795757]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#795757]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block font-medium mb-1">
            Category
          </label>
          <select
            id="category"
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#795757]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.category}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#795757] text-[#FFF0D1] py-3 rounded-xl font-semibold hover:bg-[#6a4949] transition"
        >
          Add Recipient
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AddRecipient;
