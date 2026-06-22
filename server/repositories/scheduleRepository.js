const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const { prepareRecipients } = require('../utils/scheduleHelper');

const TABLE = 'schedules';

function fromRow(row) {
  if (!row) return null;
  const task = row.task_data && typeof row.task_data === 'object' ? row.task_data : {};
  return {
    ...task,
    id: row.id,
    userId: row.user_id,
    disabled: row.is_active === false || task.disabled === true,
    createdAt: row.created_at || task.createdAt,
    updatedAt: row.updated_at || task.updatedAt,
  };
}

function toRow(schedule, userId) {
  const now = new Date().toISOString();
  const {
    id,
    userId: uid,
    user_id,
    disabled,
    cron,
    cron_expr,
    createdAt,
    updatedAt,
    ...rest
  } = schedule;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    cron_expr: cron_expr || cron || '0 9 * * 1',
    is_active: disabled !== true,
    task_data: {
      ...rest,
      disabled: disabled === true,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const listSchedules = async (userId) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
};

const getSchedule = async (id, userId) => {
  const list = await listSchedules(userId);
  return list.find((s) => String(s.id) === String(id)) || null;
};

const createSchedule = async (data, userId) => {
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

  const row = toRow(schedule, userId);
  const { data: inserted, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(inserted?.[0] || row);
};

const updateSchedule = async (id, updates, userId) => {
  const current = await getSchedule(id, userId);
  if (!current) return null;
  const row = toRow({ ...current, ...updates, id }, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      cron_expr: row.cron_expr,
      is_active: row.is_active,
      task_data: row.task_data,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
};

const addRecipientToSchedule = async (scheduleId, email, userId) => {
  const schedule = await getSchedule(scheduleId, userId);
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

  return updateSchedule(scheduleId, { recipients: newRecipients }, userId);
};

const saveSchedule = async (schedule, userId) => updateSchedule(schedule.id, schedule, userId);

const deleteSchedule = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  addRecipientToSchedule,
  saveSchedule,
  deleteSchedule,
};
