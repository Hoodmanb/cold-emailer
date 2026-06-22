/**
 * Merges user profile data on top of the system-wide default preview data.
 * Falls back to default values whenever required fields are missing or empty.
 */
function mergePreviewData(defaultProfile, userProfile) {
  if (!userProfile || typeof userProfile !== 'object') {
    return defaultProfile;
  }

  // Start with a deep clone of the default profile
  const merged = JSON.parse(JSON.stringify(defaultProfile));

  // 1. Merge primitive text fields (if present and non-empty in userProfile)
  const textFields = ['name', 'email', 'phone', 'location', 'summary', 'linkedinUrl', 'githubUrl'];
  for (const field of textFields) {
    if (userProfile[field] && String(userProfile[field]).trim() !== '') {
      merged[field] = userProfile[field];
    } else if (userProfile.links?.[field] && String(userProfile.links[field]).trim() !== '') {
      merged[field] = userProfile.links[field];
    }
  }

  // Map phoneNumber to phone if phone is missing
  if (userProfile.phoneNumber && String(userProfile.phoneNumber).trim() !== '' && (!merged.phone || merged.phone === defaultProfile.phone)) {
    merged.phone = userProfile.phoneNumber;
  }

  // 2. Merge array fields (experience, education, skills, projects, certificates)
  // If user profile has non-empty array for these fields, use them. Otherwise, fall back to defaults.
  const arrayFields = ['experience', 'education', 'skills', 'projects', 'certificates'];
  for (const field of arrayFields) {
    const userArray = userProfile[field];
    if (Array.isArray(userArray) && userArray.length > 0) {
      merged[field] = userArray;
    } else {
      // Check legacy/alternative naming for certificates
      if (field === 'certificates' && Array.isArray(userProfile.certifications) && userProfile.certifications.length > 0) {
        merged.certificates = userProfile.certifications;
      }
    }
  }

  return merged;
}

module.exports = { mergePreviewData };
