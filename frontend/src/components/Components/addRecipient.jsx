import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import api from "../../utils/api";

const AddRecipient = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState(null);

  const [categories] = useState([
    { id: 1, category: "Technology" },
    { id: 2, category: "Health" },
    { id: 3, category: "Education" },
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "https://didactic-space-zebra-7g4w45qw5wp3p576-5000.app.github.dev/api/recipient",
        {
          email,
          name,
          category,
        }
      );

      setMessage(response.data.message);

      if (response.data.message === "successful") {
        setEmail("");
        setName("");
        setCategory("");
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
              <option key={cat.id} value={cat.category}>
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
