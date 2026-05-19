
const fileStore = require("../utils/fileStore");
const { v4: uuidv4 } = require('uuid');
const { prepareRecipients } = require('../utils/scheduleHelper');

const FILE = 'schedules.json';

const listSchedules = () => fileStore.read(FILE);

const getSchedule = (id) => listSchedules().find((s) => String(s.id) === String(id)) || null;

const createSchedule = (data) => {
  const {
    name, frequency, day, hour, sender,
    recipients = [], template, templateOne, templateTwo, templateThree,
  } = data;

  const availableTemplates = {
    scheduleOne: template || null,
    scheduleTwo: templateOne || null,
    scheduleThree: templateTwo || null,
    scheduleFour: templateThree || null,
  };

  const processedRecipients = prepareRecipients(
    recipients.map((email) => (typeof email === 'string' ? { email } : email)),
    availableTemplates
  );

  const schedule = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    name,
    sender,
    frequency,
    day,
    hour,
    disabled: false,
    recipients: processedRecipients,
    template: template || null,
    templateOne: templateOne || null,
    templateTwo: templateTwo || null,
    templateThree: templateThree || null,
  };

  return fileStore.append(FILE, schedule);
};

const updateSchedule = (id, updates) =>
  fileStore.update(FILE, (s) => s.id === id, () => ({ ...updates }));

const addRecipientToSchedule = (scheduleId, email) => {
  const schedule = getSchedule(scheduleId);
  if (!schedule) return null;

  if ((Array.isArray(schedule.recipients) ? schedule.recipients : []).some((r) => r.email === email)) {
    throw new Error('Recipient already exists in schedule');
  }

  const templates = {
    scheduleOne: schedule.template,
    scheduleTwo: schedule.templateOne,
    scheduleThree: schedule.templateTwo,
    scheduleFour: schedule.templateThree,
  };

  const [prepared] = prepareRecipients([{ email }], templates);
  const newRecipients = [...(Array.isArray(schedule.recipients) ? schedule.recipients : []), prepared];

  return fileStore.update(FILE, (s) => s.id === scheduleId, () => ({ recipients: newRecipients }));
};

const saveSchedule = (schedule) =>
  fileStore.update(FILE, (s) => s.id === schedule.id, () => schedule);

const deleteSchedule = (id) => fileStore.remove(FILE, (s) => s.id === id);

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  addRecipientToSchedule,
  saveSchedule,
  deleteSchedule,
};
