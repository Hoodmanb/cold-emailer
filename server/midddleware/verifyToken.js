const firebaseAdmin = require("../utils/firebase");

const verifyToken = async (req, res, next) => {
  // verify the firebase id token sent with the authorization header from the backend
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // returns if no authorization header is set
    return res.status(401).json({ message: "Authorization header is missing" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // decode the sent authorization header
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Attach userId (uid), user email to the request object for use in other routes
    req.userId = uid;
    req.email = decodedToken.email;

    const userId = req.userId;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: error.code, error: error });
  }
};

module.exports = verifyToken;
