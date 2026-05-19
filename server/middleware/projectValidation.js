const VIDEO_URL_REGEX = /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;
const VIMEO_REGEX = /^(https?:\/\/)?(www\.)?vimeo\.com\//i;

function isValidUrl(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_err) {
    return false;
  }
}

function isValidVideoUrl(value) {
  if (!isValidUrl(value)) return false;
  return YOUTUBE_REGEX.test(value) || VIMEO_REGEX.test(value) || VIDEO_URL_REGEX.test(value);
}

function normalizeProjectPayload(req, _res, next) {
  const raw = req.body?.project;
  if (typeof raw === "string") {
    try {
      req.body = JSON.parse(raw);
      return next();
    } catch (_err) {
      const err = new Error("Invalid project payload");
      err.status = 400;
      err.errorCode = "INVALID_PROJECT_PAYLOAD";
      return next(err);
    }
  }
  return next();
}

function validateProjectInput(req, _res, next) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const errors = [];

  const title = String(body.title || "").trim();
  const summary = String(body.summary || "").trim();
  if (!title) errors.push("Project title is required");
  if (!summary) errors.push("Project summary is required");

  const videos = Array.isArray(body.demoVideos) ? body.demoVideos.filter(Boolean) : [];
  if (videos.length > 2) errors.push("Maximum of 2 demo videos allowed");
  for (const video of videos) {
    if (!isValidVideoUrl(String(video).trim())) {
      errors.push("Please provide a valid video URL");
      break;
    }
  }

  const screenshots = Array.isArray(body.screenshots) ? body.screenshots : [];
  if (screenshots.length > 2) errors.push("Maximum of 2 screenshots allowed");
  for (const shot of screenshots) {
    if (!shot || typeof shot !== "object") {
      errors.push("Screenshot payload is invalid");
      break;
    }
    const type = String(shot.type || "").trim();
    const value = String(shot.value || "").trim();
    if (!["upload", "url"].includes(type) || !value) {
      errors.push("Screenshot payload is invalid");
      break;
    }
    if (type === "url" && !isValidUrl(value)) {
      errors.push("Please provide a valid screenshot URL");
      break;
    }
  }

  if (errors.length) {
    const err = new Error(errors[0]);
    err.status = 400;
    err.errorCode = "PROJECT_VALIDATION_FAILED";
    err.errors = errors;
    return next(err);
  }

  return next();
}

module.exports = {
  normalizeProjectPayload,
  validateProjectInput,
  isValidUrl,
  isValidVideoUrl,
};
