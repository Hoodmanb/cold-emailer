const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const secretKey = Buffer.from(process.env.CRYPTO_SECRET_KEY, "hex");
const iv = crypto.randomBytes(16);

exports.encrypt = async (plainPassword) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(plainPassword, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    encryptedPassword: encrypted,
  };
};

exports.decrypt = (encryptedPassword, ivHex) => {
  const decypher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(ivHex, "hex")
  );
  let decryted = decypher.update(encryptedPassword, "hex", "utf8");
  decryted += decypher.final("utf8");
  return decryted;
};
