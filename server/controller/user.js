const User = require("../models/User.js");
const { encrypt, decrypt } = require("../utils/encription.js");

// Creating a new user
exports.create = async (req, res) => {
  const { appPassword } = req.body;
  const { userId, email } = req;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({ message: "user already exist" });
    }
    // Create a new user after hashing password
    const { encryptedPassword, iv } = await encrypt(appPassword);

    const newUser = await User.create({
      userId,
      email,
      encryptedAppPassword: encryptedPassword,
      iv,
    });

    return res.status(200).json({ message: "user created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: error.message, error });
  }
};

// updating existing user
exports.update = async (req, res) => {
  const { updatedAppPassword } = req.body;
  const { userId } = req;
  try {
    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      return res.status(404).json({ message: "user not found" });
    }
    const decryptedPassword = decrypt(
      existingUser.encryptedAppPassword,
      existingUser.iv
    );
    if (decryptedPassword === updatedAppPassword) {
      return res.status(409).json({ message: "same password" });
    }
    const { encryptedPassword, iv } = await encrypt(appPassword);
    await existingUser.update({ encryptedAppPassword: encryptedPassword, iv });
    await category.save();

    return res.status(200).json({ message: "password updated successfully" });
  } catch (error) {
    console.error("Error updating user password", error);
    return res.status(500).json({ message: "error updating password", error });
  }
};
