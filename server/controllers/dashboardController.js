const jobRepo = require('../repositories/jobRepository');
const documentRepo = require('../repositories/documentRepository');
const emailRepo = require('../repositories/emailRepository');
const { readLogs, ACTION_TYPES } = require('../logs/auditLogger');
const { requireUserId } = require('../utils/requireUserId');

const getDashboardStats = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const jobs = jobRepo.listJobs(userId);
  const documents = documentRepo.listDocuments(undefined, userId);
  const emails = emailRepo.listEmails({ userId });
  const logs = readLogs({ limit: 50 });

  const totalJobs = jobs.length;
  const documentsGenerated = documents.length;
  const emailsSent = emails.filter((e) => e.status === 'sent').length;

  const validScores = jobs.filter((j) => typeof j.atsScore === 'number');
  const avgAtsScore = validScores.length
    ? Math.round(validScores.reduce((sum, j) => sum + j.atsScore, 0) / validScores.length)
    : 0;

  const drafted = emails.filter((e) => e.status === 'draft').length;
  const applied = emails.filter((e) => e.status === 'sent').length;
  const interviewing = 0;

  const aiGenerations = logs.filter((l) => l.action === ACTION_TYPES.AI_GENERATED);

  res.status(200).json({
    message: 'retrieved successfully',
    data: {
      metrics: { totalJobs, documentsGenerated, emailsSent, avgAtsScore },
      pipeline: { drafted, readyToApply: documents.length, applied, followUpSent: 0, interviewing },
      recentActivity: logs.slice(0, 5),
      aiUsage: { model: 'Your OpenRouter Model', weeklyGenerations: aiGenerations.length, avgQualityScore: 8.5 },
      suggestedActions: [],
    },
  });
};

module.exports = { getDashboardStats };
