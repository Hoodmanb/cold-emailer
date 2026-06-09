const { z } = require('zod');
const cronParser = require('cron-parser');

const JOB_TYPES = [
  'job-search',
  'resume-generation',
  'cover-letter-generation',
  'ats-analysis',
  'cold-email-send',
  'follow-up-email',
  'campaign-execution'
];

const scheduleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(JOB_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${JOB_TYPES.join(', ')}` })
  }),
  cron: z.string().optional().nullable().refine((val) => {
    if (!val) return true; // optional / one-off
    try {
      cronParser.parseExpression(val);
      return true;
    } catch (_) {
      return false;
    }
  }, {
    message: 'Invalid cron expression'
  }),
  payload: z.record(z.any()).optional().default({}),
});

module.exports = {
  scheduleSchema,
  JOB_TYPES,
};
