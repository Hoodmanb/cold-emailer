const scheduleRepo = require('../repositories/scheduleRepository');
const { runScheduler } = require('../modules/email/scheduler');

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
  const { template } = req.body;
  if (!template?.subject || !template?.body) {
    return res.status(400).json({ message: 'Main template (subject and body) is required.' });
  }
  try {
    const schedule = scheduleRepo.createSchedule(req.body);
    return res.status(200).json({ message: 'Schedule created', schedule });
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

module.exports = { listSchedules, getSchedule, createSchedule, addRecipient, runSchedule, deleteSchedule };
