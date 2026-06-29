/** Must stay in sync with server/services/ai/promptPlaceholderValidation.js */
export const REQUIRED_PROMPT_PLACEHOLDERS: Record<string, string[]> = {
  resume_generation: ["job_description", "candidate_profile"],
  professional_cv_generation: ["job_description", "candidate_profile"],
  cover_letter_generation: ["job_title", "company_name", "job_description", "candidate_profile"],
  email_generation: [
    "job_title",
    "company_name",
    "recipient_info",
    "candidate_name",
    "candidate_skills",
    "candidate_summary",
  ],
  ats_analysis: ["job_description", "candidate_profile"],
  project_summary_generation: ["project_title", "project_description", "technologies"],
};

const PLACEHOLDER_HELP: Record<string, string> = {
  candidate_profile: "your profile data",
  job_description: "the job description",
  job_title: "the job title",
  company_name: "the company name",
  recipient_info: "recipient details",
  candidate_name: "your name",
  candidate_skills: "your skills",
  candidate_summary: "your summary",
  project_title: "the project title",
  project_description: "the project description",
  technologies: "technologies used",
};

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function extractPromptPlaceholders(content: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

export function buildPlaceholderValidationMessage(featureName: string, missing: string[]): string {
  const tokens = missing.map((p) => `{{${p}}}`).join(", ");
  const dataLabels = missing.map((p) => PLACEHOLDER_HELP[p] || p).join(", ");
  return (
    `Cannot save custom prompt for ${featureName}: your prompt must include ${tokens}. ` +
    `Those placeholders inject ${dataLabels} at generation time — without them the AI never receives your data and may invent content. ` +
    `Copy the default prompt or add the missing placeholders exactly as shown.`
  );
}

export function validateCustomPromptConfig(
  featureId: string,
  featureName: string,
  config: { useCustomPrompt?: boolean; customPrompt?: string }
): { valid: true } | { valid: false; message: string; missing: string[] } {
  const required = REQUIRED_PROMPT_PLACEHOLDERS[featureId];
  if (!required?.length || !config.useCustomPrompt) {
    return { valid: true };
  }

  const text = String(config.customPrompt || "").trim();
  if (!text) {
    return {
      valid: false,
      missing: required,
      message: buildPlaceholderValidationMessage(featureName, required),
    };
  }

  const found = new Set(extractPromptPlaceholders(text));
  const missing = required.filter((p) => !found.has(p));
  if (missing.length) {
    return {
      valid: false,
      missing,
      message: buildPlaceholderValidationMessage(featureName, missing),
    };
  }

  return { valid: true };
}

export function getRequiredPlaceholders(featureId: string): string[] {
  return REQUIRED_PROMPT_PLACEHOLDERS[featureId] || [];
}
