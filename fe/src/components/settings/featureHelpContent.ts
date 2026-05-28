export interface FeatureHelpInfo {
  title: string;
  description: string;
  workflows: string[];
  examples: string[];
  promptImpact: string;
}

export const FEATURE_HELP: Record<string, FeatureHelpInfo> = {
  resume_generation: {
    title: "Resume Generation",
    description: "Controls how AI generates ATS-optimized, role-tailored resumes from your profile and job descriptions.",
    workflows: ["Job detail ATS flow", "Quick Access document generator", "Workflow regenerate"],
    examples: ["Emphasize metrics in experience bullets", "Prioritize cloud skills for DevOps roles"],
    promptImpact: "Affects wording style, ATS keyword alignment, section structure, and tailoring intensity.",
  },
  professional_cv_generation: {
    title: "Professional CV Generation",
    description: "Controls how AI generates detailed, multi-page professional CVs with comprehensive career history.",
    workflows: ["Quick Access Professional CV", "Job workflow (when CV selected)", "Document generator"],
    examples: ["Include all certifications and projects", "Expand leadership narrative for consulting roles"],
    promptImpact: "Affects depth of experience, achievement detail, certifications coverage, and long-form summaries.",
  },
  cover_letter_generation: {
    title: "Cover Letter Generation",
    description: "Controls tone, structure, and persuasion strategy for targeted cover letters.",
    workflows: ["Job ATS workflow", "Quick Access generator"],
    examples: ["More formal tone for enterprise roles", "Highlight startup experience for early-stage companies"],
    promptImpact: "Affects opening hook, body narrative, closing CTA, and company-specific tailoring.",
  },
  email_generation: {
    title: "Cold Outreach Email",
    description: "Controls cold email subject lines, body copy, personalization, and professional tone.",
    workflows: ["Job workflow email generation", "Quick Access mail attachment flow"],
    examples: ["Shorter emails for busy executives", "More technical depth for engineering managers"],
    promptImpact: "Affects subject line strategy, personalization depth, length, and call-to-action style.",
  },
  ats_analysis: {
    title: "ATS Match Analysis",
    description: "Controls how AI evaluates your profile against job descriptions and identifies keyword gaps.",
    workflows: ["Job detail ATS review", "Pre-generation analysis step"],
    examples: ["Stricter scoring for senior roles", "Emphasize technical skill matching"],
    promptImpact: "Affects scoring logic, keyword extraction, gap analysis, and improvement recommendations.",
  },
  chatbot_assistant: {
    title: "Chat Assistant",
    description: "System prompt for the floating AI assistant — defines personality, scope, and response style.",
    workflows: ["Quick Access AI Assistant modal"],
    examples: ["More concise responses", "Focus on interview prep vs. resume editing"],
    promptImpact: "Affects assistant tone, depth, specialization areas, and response format.",
  },
  advanced_doc_generation: {
    title: "Advanced Document Generation",
    description: "Controls generation of proposals, case studies, portfolios, and other custom document types.",
    workflows: ["Quick Access document generator (non-resume types)"],
    examples: ["Executive tone for client proposals", "Technical depth for case studies"],
    promptImpact: "Affects document structure, audience targeting, and professional framing.",
  },
  project_summary_generation: {
    title: "Project Summary",
    description: "Controls how project descriptions are transformed into portfolio-grade summaries.",
    workflows: ["Profile project summaries", "Portfolio documents"],
    examples: ["Highlight scalability decisions", "Emphasize AI/ML components"],
    promptImpact: "Affects technical depth, business impact framing, and readability.",
  },
  job_extraction_image: {
    title: "Job Extraction (Image)",
    description: "Controls OCR and structured extraction from job posting screenshots.",
    workflows: ["Job creation from image upload"],
    examples: ["Better skill keyword extraction", "Improved company name parsing"],
    promptImpact: "Affects extraction accuracy, field normalization, and keyword identification.",
  },
};

export function getFeatureHelp(featureId: string): FeatureHelpInfo {
  return FEATURE_HELP[featureId] || {
    title: featureId.replace(/_/g, " "),
    description: "Custom prompt instructions for this AI feature.",
    workflows: ["Various app workflows"],
    examples: ["Adjust tone and output format"],
    promptImpact: "Changes how the AI interprets inputs and formats outputs.",
  };
}
