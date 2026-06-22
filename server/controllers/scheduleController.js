const scheduleRepo = require('../repositories/scheduleRepository');
const templateRepo = require('../repositories/templateRepository');
const attachmentsRepo = require('../modules/documents/attachments/repository');
const { runScheduler } = require('../modules/email/scheduler');
const { requireUserId } = require('../utils/requireUserId');

async function resolveTemplateField(value, userId) {
  if (!value) return null;
  if (typeof value === 'object' && value.subject && value.body) return value;
  const tpl = await templateRepo.getTemplate(value, userId);
  if (!tpl) return null;
  return { subject: tpl.subject, body: tpl.body, templateId: tpl._id || tpl.id };
}

const listSchedules = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const schedules = await scheduleRepo.listSchedules(userId);
  return res.status(200).json({ message: 'retrieved successfully', data: schedules });
};

const getSchedule = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const schedule = await scheduleRepo.getSchedule(req.params.id, userId);
  if (!schedule) return res.status(404).json({ message: 'No schedule found' });
  return res.status(200).json({ message: 'retrieved successfully', data: schedule });
};

const createSchedule = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const body = { ...req.body };
  body.template = await resolveTemplateField(body.template, userId);
  body.templateOne = await resolveTemplateField(body.templateOne, userId);
  body.templateTwo = await resolveTemplateField(body.templateTwo, userId);
  body.templateThree = await resolveTemplateField(body.templateThree, userId);

  if (!body.template?.subject || !body.template?.body) {
    return res.status(400).json({ message: 'Main template (subject and body) is required.' });
  }
  try {
    const schedule = await scheduleRepo.createSchedule(body, userId);
    if (Array.isArray(body.attachmentRecords)) {
      for (const record of body.attachmentRecords) {
        await attachmentsRepo.addAttachment({
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

const updateSchedule = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const existing = await scheduleRepo.getSchedule(req.params.id, userId);
  if (!existing) return res.status(404).json({ message: 'Schedule not found' });

  const body = { ...req.body };
  if (body.template !== undefined) body.template = await resolveTemplateField(body.template, userId);
  if (body.templateOne !== undefined) body.templateOne = await resolveTemplateField(body.templateOne, userId);
  if (body.templateTwo !== undefined) body.templateTwo = await resolveTemplateField(body.templateTwo, userId);
  if (body.templateThree !== undefined) body.templateThree = await resolveTemplateField(body.templateThree, userId);

  try {
    const updated = await scheduleRepo.updateSchedule(req.params.id, { ...existing, ...body, id: existing.id }, userId);
    return res.status(200).json({ message: 'updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const addRecipient = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { id } = req.params;
  const { email } = req.body;

  try {
    const updated = await scheduleRepo.addRecipientToSchedule(id, email, userId);
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

const deleteSchedule = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const count = await scheduleRepo.deleteSchedule(req.params.id, userId);
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
