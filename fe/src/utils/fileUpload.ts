import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const userId = user?.uid; // 

export const uploadFileToFirebase = async (file: File, folder = 'cold_mailer') => {
  try {
    if (!file) {
      return { success: false, message: 'No file provided', url: null };
      console.log("No file provided")
    }

    const storage = getStorage(); 
    const fileRef = ref(storage, `${folder}/${userId}/${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(fileRef, file);

    // Get the file URL
    const downloadURL = await getDownloadURL(snapshot.ref);
console.log("Uploading...")
    return {
      success: true,
      message: 'File uploaded successfully',
      url: downloadURL,
    };
    console.log("Uploaded", downloadURL)
  } catch (error: any) {
    console.error('File upload error:', error);
    return {
      success: false,
      message: error.message || 'File upload failed',
      url: null,
    };
  }
};
