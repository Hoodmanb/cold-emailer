const multer = require("multer");
const { getProfile, updateProfile } = require("../repositories/profileRepository");
const { getAllProjects, createProject, updateProject, deleteProject } = require("../repositories/projectRepository");
const { getSettings, updateSettings } = require("../repositories/settingsRepository");
const { encrypt } = require("../utils/encryption");
const { normalizeProfilePayload } = require("../utils/profileNormalize");
const { log, ACTION_TYPES } = require("../logs/auditLogger");
const { successResponse } = require("../utils/response");

const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    return cb(null, true);
  },
});

const getProfileHandler = (req, res) =>
  successResponse(res, {
    status: 200,
    message: "Profile retrieved successfully",
    data: getProfile(),
  });

const updateProfileHandler = (req, res) => {
  const updated = updateProfile(normalizeProfilePayload(req.body));
  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Career profile updated" });
  return successResponse(res, {
    status: 200,
    message: "Profile updated successfully",
    data: updated,
  });
};

const getProjectsHandler = (req, res) => {
  const projects = getAllProjects();
  console.log(`[profileController] Fetched ${projects.length} projects for user ${req.user?.id}`);
  return successResponse(res, {
    status: 200,
    message: "Projects retrieved successfully",
    data: projects,
    meta: { count: projects.length },
  });
};

const createProjectHandler = (req, res) => {
  const created = createProject(req.body);
  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Project created" });
  return successResponse(res, {
    status: 201,
    message: "Project created successfully",
    data: created,
  });
};

const updateProjectHandler = (req, res) => {
  const { projectId } = req.params;
  const updated = updateProject(projectId, req.body);
  if (!updated) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Project updated" });
  return successResponse(res, {
    status: 200,
    message: "Project updated successfully",
    data: updated,
  });
};

const deleteProjectHandler = (req, res) => {
  const { projectId } = req.params;
  const removedCount = deleteProject(projectId);
  if (removedCount === 0) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Project deleted" });
  return successResponse(res, {
    status: 200,
    message: "Project deleted successfully",
    data: { id: projectId },
  });
};

const uploadScreenshotHandler = (req, res) => {
  if (!req.file) {
    const err = new Error("Please upload a valid screenshot image");
    err.status = 400;
    throw err;
  }
  const base64 = req.file.buffer.toString("base64");
  const value = `data:${req.file.mimetype};base64,${base64}`;
  return successResponse(res, {
    status: 201,
    message: "Screenshot uploaded successfully",
    data: { value, fileName: req.file.originalname },
  });
};

const getSkillsHandler = (_req, res) =>
  successResponse(res, {
    status: 200,
    message: "Skills retrieved successfully",
    data: getProfile().skills || [],
  });

const createSkillHandler = (req, res) => {
  const { normalizeSkillsInput } = require("../utils/profileNormalize");
  const profile = getProfile();
  const rawInput = req.body?.name || req.body?.skills;

  if (!rawInput) throw new Error("Skill name or skills array required");

  const newSkillNames = normalizeSkillsInput(rawInput);
  const existingSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const existingNamesLower = new Set(existingSkills.map((s) => s.name.toLowerCase()));

  const added = [];
  for (const name of newSkillNames) {
    if (!existingNamesLower.has(name.toLowerCase())) {
      const skill = { id: require("uuid").v4(), name };
      existingSkills.push(skill);
      added.push(skill);
      existingNamesLower.add(name.toLowerCase());
    }
  }

  if (added.length > 0) {
    updateProfile({ skills: existingSkills });
  }

  log(ACTION_TYPES.PROFILE_UPDATED, { 
    module: "profile", 
    details: `Added ${added.length} skill(s): ${added.map(s => s.name).join(", ")}` 
  });

  return successResponse(res, {
    status: 201,
    message: added.length > 0 ? "Skills added successfully" : "Skills already exist",
    data: added.length === 1 ? added[0] : added,
  });
};

const getCertificatesHandler = (_req, res) =>
  successResponse(res, {
    status: 200,
    message: "Certificates retrieved successfully",
    data: getProfile().certificates || [],
  });

const createCertificateHandler = (req, res) => {
  const profile = getProfile();
  const certificates = Array.isArray(profile.certificates) ? profile.certificates : [];
  const { normalizeCertificates } = require("../utils/profileNormalize");

  const newCert = { ...req.body, id: require("uuid").v4() };
  const normalized = normalizeCertificates([newCert]);

  if (normalized.length === 0) {
    throw new Error("Invalid certificate data (valid link required)");
  }

  certificates.push(normalized[0]);
  updateProfile({ certificates });

  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Certificate added" });
  return successResponse(res, {
    status: 201,
    message: "Certificate added successfully",
    data: normalized[0],
  });
};

const updateCertificateHandler = (req, res) => {
  const { certId } = req.params;
  const profile = getProfile();
  const certificates = (profile.certificates || []).map((c) =>
    String(c.id) === String(certId) ? { ...c, ...req.body, id: certId } : c
  );
  
  const { normalizeCertificates } = require("../utils/profileNormalize");
  const normalized = normalizeCertificates(certificates);
  updateProfile({ certificates: normalized });

  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Certificate updated" });
  return successResponse(res, {
    status: 200,
    message: "Certificate updated successfully",
    data: normalized.find((c) => String(c.id) === String(certId)),
  });
};

const deleteCertificateHandler = (req, res) => {
  const { certId } = req.params;
  const profile = getProfile();
  const certificates = (profile.certificates || []).filter((c) => String(c.id) !== String(certId));
  updateProfile({ certificates });

  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Certificate removed" });
  return successResponse(res, {
    status: 200,
    message: "Certificate removed successfully",
    data: { id: certId },
  });
};

const deleteSkillHandler = (req, res) => {
  const { skillId } = req.params;
  const profile = getProfile();
  const skills = (profile.skills || []).filter((s) => String(s.id) !== String(skillId));
  updateProfile({ skills });

  log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Skill removed" });
  return successResponse(res, {
    status: 200,
    message: "Skill removed successfully",
    data: { id: skillId },
  });
};

const getPreferencesHandler = (_req, res) =>
  successResponse(res, {
    status: 200,
    message: "Preferences retrieved successfully",
    data: getSettings(),
  });

const updatePreferencesHandler = (req, res) => {
  const updated = updateSettings(req.body);
  return successResponse(res, {
    status: 200,
    message: "Preferences updated successfully",
    data: updated,
  });
};

const deleteAccountHandler = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    const err = new Error("Unauthenticated request");
    err.status = 401;
    throw err;
  }

  // 1. Audit the destructive event
  log(ACTION_TYPES.ACCOUNT_DELETED, { 
    module: "profile", 
    details: `User permanently deleted account (ID: ${userId})` 
  });

  // 2. Clear out user data
  const { deleteUserAndCleanup } = require("../repositories/userRepository");
  deleteUserAndCleanup(userId);

  return successResponse(res, {
    status: 200,
    message: "Account permanently deleted and all data purged successfully",
    data: { id: userId },
  });
};

module.exports = {
  screenshotUpload,
  getProfileHandler,
  updateProfile: updateProfileHandler,
  getProjectsHandler,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  uploadScreenshotHandler,
  getSkillsHandler,
  createSkillHandler,
  deleteSkillHandler,
  getCertificatesHandler,
  createCertificateHandler,
  updateCertificateHandler,
  deleteCertificateHandler,
  getPreferencesHandler,
  updatePreferences: updatePreferencesHandler,
  deleteAccountHandler,
};
