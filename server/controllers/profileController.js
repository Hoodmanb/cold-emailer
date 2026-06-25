const multer = require("multer");
const { getProfile, updateProfile } = require("../repositories/profileRepository");
const { getAllProjects, createProject, updateProject, deleteProject } = require("../repositories/projectRepository");
const { getSettings, updateSettings } = require("../repositories/settingsRepository");
const { encrypt } = require("../utils/encryption");
const { normalizeProfilePayload } = require("../utils/profileNormalize");
const { log, ACTION_TYPES } = require("../logs/auditLogger");
const { successResponse } = require("../utils/response");
const { requireUserId } = require("../utils/requireUserId");
const Supabase = require("../services/supabaseService");
const { uploadBuffer } = require("../utils/cloudinaryClient");

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

const getProfileHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  return successResponse(res, {
    status: 200,
    message: "Profile retrieved successfully",
    data: await getProfile(userId),
  });
};
const getProfileJsonHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const profile = await getProfile(userId);
  const jsonString = JSON.stringify(profile, null, 2);
  return successResponse(res, {
    status: 200,
    message: "Profile JSON retrieved successfully",
    data: jsonString,
  });
};

const updateProfileHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!req.body || typeof req.body !== "object") {
    const err = new Error("Profile payload must be a JSON object");
    err.status = 400;
    throw err;
  }
  await updateProfile(normalizeProfilePayload(req.body), userId);
  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Career profile updated" });
  return successResponse(res, {
    status: 200,
    message: "Profile updated successfully",
    data: await getProfile(userId),
  });
};

const getProjectsHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const projects = await getAllProjects(userId);
  console.log(`[profileController] Fetched ${projects.length} projects for user ${req.user?.id}`);
  return successResponse(res, {
    status: 200,
    message: "Projects retrieved successfully",
    data: projects,
    meta: { count: projects.length },
  });
};

const createProjectHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const created = await createProject(req.body, userId);
  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Project created" });
  return successResponse(res, {
    status: 201,
    message: "Project created successfully",
    data: created,
  });
};

const updateProjectHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { projectId } = req.params;
  const updated = await updateProject(projectId, req.body, userId);
  if (!updated) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Project updated" });
  return successResponse(res, {
    status: 200,
    message: "Project updated successfully",
    data: updated,
  });
};

const deleteProjectHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { projectId } = req.params;
  const removedCount = await deleteProject(projectId, userId);
  if (removedCount === 0) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Project deleted" });
  return successResponse(res, {
    status: 200,
    message: "Project deleted successfully",
    data: { id: projectId },
  });
};

const uploadScreenshotHandler = async (req, res) => {
  if (!req.file) {
    const err = new Error("Please upload a valid screenshot image");
    err.status = 400;
    throw err;
  }

  // 1️⃣ Upload to Cloudinary
  const { public_id, url, format, bytes } = await uploadBuffer(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    "screenshots"
  );

  // 2️⃣ Store metadata in Supabase
  const { data, error } = await Supabase.insert(
    "uploads",
    { public_id, url, format, bytes },
    req.user.id
  );

  if (error) {
    const err = new Error("Failed to record upload metadata");
    err.status = 500;
    throw err;
  }

  return successResponse(res, {
    status: 201,
    message: "Screenshot uploaded successfully",
    data: { id: data[0].id, url, public_id, format, bytes },
  });
};

const getSkillsHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const profile = await getProfile(userId);
  return successResponse(res, {
    status: 200,
    message: "Skills retrieved successfully",
    data: profile.skills || [],
  });
};

const createSkillHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { normalizeSkillsInput } = require("../utils/profileNormalize");
  const profile = await getProfile(userId);
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
    await updateProfile({ skills: existingSkills }, userId);
  }

  await log(ACTION_TYPES.PROFILE_UPDATED, { 
    module: "profile", 
    details: `Added ${added.length} skill(s): ${added.map(s => s.name).join(", ")}` 
  });

  return successResponse(res, {
    status: 201,
    message: added.length > 0 ? "Skills added successfully" : "Skills already exist",
    data: added.length === 1 ? added[0] : added,
  });
};

const getCertificatesHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const profile = await getProfile(userId);
  return successResponse(res, {
    status: 200,
    message: "Certificates retrieved successfully",
    data: profile.certificates || [],
  });
};

const createCertificateHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const profile = await getProfile(userId);
  const certificates = Array.isArray(profile.certificates) ? profile.certificates : [];
  const { normalizeCertificates } = require("../utils/profileNormalize");

  const newCert = { ...req.body, id: require("uuid").v4() };
  const normalized = normalizeCertificates([newCert]);

  if (normalized.length === 0) {
    throw new Error("Invalid certificate data (valid link required)");
  }

  certificates.push(normalized[0]);
  await updateProfile({ certificates }, userId);

  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Certificate added" });
  return successResponse(res, {
    status: 201,
    message: "Certificate added successfully",
    data: normalized[0],
  });
};

const updateCertificateHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { certId } = req.params;
  const profile = await getProfile(userId);
  const certificates = (profile.certificates || []).map((c) =>
    String(c.id) === String(certId) ? { ...c, ...req.body, id: certId } : c
  );
  
  const { normalizeCertificates } = require("../utils/profileNormalize");
  const normalized = normalizeCertificates(certificates);
  await updateProfile({ certificates: normalized }, userId);

  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Certificate updated" });
  return successResponse(res, {
    status: 200,
    message: "Certificate updated successfully",
    data: normalized.find((c) => String(c.id) === String(certId)),
  });
};

const deleteCertificateHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { certId } = req.params;
  const profile = await getProfile(userId);
  const certificates = (profile.certificates || []).filter((c) => String(c.id) !== String(certId));
  await updateProfile({ certificates }, userId);

  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Certificate removed" });
  return successResponse(res, {
    status: 200,
    message: "Certificate removed successfully",
    data: { id: certId },
  });
};

const updateSkillHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { skillId } = req.params;
  if (!skillId) {
    const err = new Error("Skill ID is required");
    err.status = 400;
    throw err;
  }

  const name = String(req.body?.name || "").trim();
  if (!name) {
    const err = new Error("Skill name is required");
    err.status = 400;
    throw err;
  }

  const profile = await getProfile(userId);
  const skills = (profile.skills || []).map((s) =>
    String(s.id) === String(skillId) ? { ...s, name } : s
  );

  const { normalizeSkillRecords } = require("../utils/profileNormalize");
  const normalized = normalizeSkillRecords(skills);
  const updatedSkill = normalized.find((s) => String(s.id) === String(skillId));
  if (!updatedSkill) {
    const err = new Error("Skill not found");
    err.status = 404;
    throw err;
  }

  await updateProfile({ skills: normalized }, userId);

  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: `Skill updated: ${name}` });
  return successResponse(res, {
    status: 200,
    message: "Skill updated successfully",
    data: updatedSkill,
  });
};

const getEmailConfigHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const profile = await getProfile(userId);
  return successResponse(res, {
    status: 200,
    message: "Email config retrieved successfully",
    data: {
      senderName: profile.name || "",
      senderEmail: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
    },
  });
};

const updateEmailConfig = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const updates = {};

  if (body.senderName !== undefined) updates.name = String(body.senderName || "").trim();
  if (body.senderEmail !== undefined) updates.email = String(body.senderEmail || "").trim();
  if (body.phoneNumber !== undefined) updates.phoneNumber = String(body.phoneNumber || "").trim();
  if (body.name !== undefined) updates.name = String(body.name || "").trim();
  if (body.email !== undefined) updates.email = String(body.email || "").trim();

  if (!Object.keys(updates).length) {
    const err = new Error("No email config fields provided");
    err.status = 400;
    throw err;
  }

  await updateProfile(normalizeProfilePayload(updates), userId);
  await log(ACTION_TYPES.EMAIL_CONFIG_UPDATED, { module: "profile", details: "Email sender config updated" });

  const profile = await getProfile(userId);
  return successResponse(res, {
    status: 200,
    message: "Email config updated successfully",
    data: {
      senderName: profile.name || "",
      senderEmail: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
    },
  });
};

const deleteSkillHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { skillId } = req.params;
  const profile = await getProfile(userId);
  const skills = (profile.skills || []).filter((s) => String(s.id) !== String(skillId));
  await updateProfile({ skills }, userId);

  await log(ACTION_TYPES.PROFILE_UPDATED, { module: "profile", details: "Skill removed" });
  return successResponse(res, {
    status: 200,
    message: "Skill removed successfully",
    data: { id: skillId },
  });
};

const getPreferencesHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  return successResponse(res, {
    status: 200,
    message: "Preferences retrieved successfully",
    data: await getSettings(userId),
  });
};

const updatePreferencesHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const updated = await updateSettings(req.body, userId);
  return successResponse(res, {
    status: 200,
    message: "Preferences updated successfully",
    data: updated,
  });
};

const deleteAccountHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    const err = new Error("Unauthenticated request");
    err.status = 401;
    throw err;
  }

  await log(ACTION_TYPES.ACCOUNT_DELETED, { 
    module: "profile", 
    details: `User permanently deleted account (ID: ${userId})` 
  });

  const { deleteUserAndCleanup } = require("../repositories/userRepository");
  await deleteUserAndCleanup(userId);

  return successResponse(res, {
    status: 200,
    message: "Account permanently deleted and all data purged successfully",
    data: { id: userId },
  });
};

module.exports = {
  screenshotUpload,
  getProfileJsonHandler,
  getProfileHandler,

  updateProfile: updateProfileHandler,
  getProjectsHandler,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  uploadScreenshotHandler,
  getSkillsHandler,
  createSkillHandler,
  updateSkillHandler,
  deleteSkillHandler,
  getCertificatesHandler,
  createCertificateHandler,
  updateCertificateHandler,
  deleteCertificateHandler,
  getPreferencesHandler,
  updatePreferences: updatePreferencesHandler,
  getEmailConfigHandler,
  updateEmailConfig,
  deleteAccountHandler,
};
