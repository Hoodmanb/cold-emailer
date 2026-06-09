const fileStore = require('../utils/fileStore');
const { ensureArray } = require('../utils/jsonNormalizer');
const { v4: uuidv4 } = require('uuid');
const { prepareRecipients } = require('../utils/scheduleHelper');

const FILE = 'schedules.json';

const listSchedules = (userId) => ensureArray(fileStore.read(FILE, userId));

const getSchedule = (id, userId) =>
  listSchedules(userId).find((s) => String(s.id) === String(id)) || null;

const createSchedule = (data, userId) => {
  const {
    name,
    frequency,
    day,
    hour,
    sender,
    recipients = [],
    template,
    templateOne,
    templateTwo,
    templateThree,
  } = data;

  const availableTemplates = {
    scheduleOne: template || null,
    scheduleTwo: templateOne || null,
    scheduleThree: templateTwo || null,
    scheduleFour: templateThree || null,
  };

  const processedRecipients = prepareRecipients(
    recipients.map((email) => (typeof email === 'string' ? { email } : email)),
    availableTemplates,
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

  return fileStore.append(FILE, schedule, userId);
};

const updateSchedule = (id, updates, userId) =>
  fileStore.update(
    FILE,
    (s) => String(s.id) === String(id),
    (s) => ({ ...s, ...updates, id: s.id }),
    userId,
  );

const addRecipientToSchedule = (scheduleId, email, userId) => {
  const schedule = getSchedule(scheduleId, userId);
  if (!schedule) return null;

  if (
    (Array.isArray(schedule.recipients) ? schedule.recipients : []).some((r) => r.email === email)
  ) {
    throw new Error('Recipient already exists in schedule');
  }

  const templates = {
    scheduleOne: schedule.template,
    scheduleTwo: schedule.templateOne,
    scheduleThree: schedule.templateTwo,
    scheduleFour: schedule.templateThree,
  };

  const [prepared] = prepareRecipients([{ email }], templates);
  const newRecipients = [
    ...(Array.isArray(schedule.recipients) ? schedule.recipients : []),
    prepared,
  ];

  return fileStore.update(
    FILE,
    (s) => s.id === scheduleId,
    () => ({ recipients: newRecipients }),
    userId,
  );
};

const saveSchedule = (schedule, userId) =>
  fileStore.update(FILE, (s) => s.id === schedule.id, () => schedule, userId);

const deleteSchedule = (id, userId) =>
  fileStore.remove(FILE, (s) => s.id === id, userId);

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  addRecipientToSchedule,
  saveSchedule,
  deleteSchedule,
};
