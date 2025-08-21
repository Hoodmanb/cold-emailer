// Function to handle Firebase errors
export default function handleFirebaseError(code:string) {
  switch (code) {
    // Authentication Errors
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/email-already-in-use':
      return 'This email is already in use.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No user found with this email.';
    case 'auth/wrong-password':
      return 'The password is incorrect.';
    case 'auth/weak-password':
      return 'The password is too weak.';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed. Please contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please try again later.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'The popup was closed before completing the sign-in.';
    case 'auth/cancelled-popup-request':
      return 'Popup request was canceled. Try again.';
    case 'auth/invalid-verification-code':
      return 'The verification code is not valid.';
    case 'auth/invalid-verification-id':
      return 'The verification ID is not valid.';
    case 'auth/requires-recent-login':
      return 'Please re-authenticate and try again.';
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with another account.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in credentials.';
    case 'auth/invalid-credential':
      return 'The credential is invalid.';
    case 'auth/missing-email':
      return 'Email address is required.';

    // Storage Errors
    case 'storage/unauthorized':
      return 'You are not authorized to access this storage location.';
    case 'storage/canceled':
      return 'The operation was canceled.';
    case 'storage/unknown':
      return 'An unknown error occurred while accessing storage.';
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded.';
    case 'storage/retry-limit-exceeded':
      return 'Retry limit for upload exceeded, please try again.';
    case 'storage/invalid-argument':
      return 'Invalid argument provided to storage.';
    case 'storage/invalid-event-name':
      return 'Invalid event name provided.';
    case 'storage/invalid-url':
      return 'Invalid URL provided to storage.';
    case 'storage/unauthenticated':
      return 'User is unauthenticated, please authenticate and try again.';
    case 'storage/server-file-wrong-size':
      return 'Server file wrong size, please try again.';
    case 'storage/bucket-not-found':
      return 'The storage bucket could not be found.';
    case 'storage/object-not-found':
      return 'The storage object could not be found.';
    default:
      return `Unknown error: ${code}`;
  }
}