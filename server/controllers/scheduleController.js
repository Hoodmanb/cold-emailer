const scheduleRepo = require('../repositories/scheduleRepository');
const templateRepo = require('../repositories/templateRepository');
const attachmentsRepo = require('../modules/documents/attachments/repository');
// const { runScheduler } = require('../modules/email/scheduler'); // Legacy scheduler removed
const { getCurrentUserId } = require('../middleware/requestContext');

function resolveTemplateField(value) {
  if (!value) return null;
  if (typeof value === 'object' && value.subject && value.body) return value;
  const tpl = templateRepo.getTemplate(value);
  if (!tpl) return null;
  return { subject: tpl.subject, body: tpl.body, templateId: tpl._id || tpl.id };
}

const listSchedules = (req, res) => {
  const schedules = scheduleRepo.listSchedules();
  return res.status(200).json({ message: 'retrieved successfully', data: schedules });
};

const getSchedule = (req, res) => {
  const schedule = scheduleRepo.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ message: 'No schedule found' });
  return res.status(200).json({ message: 'retrieved successfully', data: schedule });
};

const createSchedule = (req, res) => {
  const body = { ...req.body };
  body.template = resolveTemplateField(body.template);
  body.templateOne = resolveTemplateField(body.templateOne);
  body.templateTwo = resolveTemplateField(body.templateTwo);
  body.templateThree = resolveTemplateField(body.templateThree);

  if (!body.template?.subject || !body.template?.body) {
    return res.status(400).json({ message: 'Main template (subject and body) is required.' });
  }
  try {
    const schedule = scheduleRepo.createSchedule(body);
    const userId = getCurrentUserId();
    if (userId && Array.isArray(body.attachmentRecords)) {
      for (const record of body.attachmentRecords) {
        attachmentsRepo.addAttachment({
          userId,
          ...record,
          parentId: schedule.id,
          parentType: 'schedule',
        });
      }
    }
    return res.status(200).json({ message: 'created successfully', data: schedule, schedule });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const updateSchedule = (req, res) => {
  const existing = scheduleRepo.getSchedule(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Schedule not found' });

  const body = { ...req.body };
  if (body.template !== undefined) body.template = resolveTemplateField(body.template);
  if (body.templateOne !== undefined) body.templateOne = resolveTemplateField(body.templateOne);
  if (body.templateTwo !== undefined) body.templateTwo = resolveTemplateField(body.templateTwo);
  if (body.templateThree !== undefined) body.templateThree = resolveTemplateField(body.templateThree);

  try {
    const updated = scheduleRepo.updateSchedule(req.params.id, { ...existing, ...body, id: existing.id });
    return res.status(200).json({ message: 'updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const addRecipient = (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    const updated = scheduleRepo.addRecipientToSchedule(id, email);
    if (!updated) return res.status(404).json({ message: 'Schedule not found' });
    return res.status(201).json({ message: 'Recipient added successfully' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const runSchedule = async (req, res) => {
  try {
    const result = await runScheduler();
    return res.status(200).json({ message: `Scheduler completed. Ran: ${result.ran}, Queued: ${result.queued}`, ...result });
  } catch (error) {
    return res.status(500).json({ message: 'Scheduler failed', error: error.message });
  }
};

const deleteSchedule = (req, res) => {
  const count = scheduleRepo.deleteSchedule(req.params.id);
  if (count === 0) return res.status(404).json({ message: 'Schedule not found' });
  return res.status(204).send();
};

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  addRecipient,
  runSchedule,
  deleteSchedule,
};
