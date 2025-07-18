// src/utils/authHelpers.js
import { getAuth } from 'firebase/auth';

export const getAuthToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
};
