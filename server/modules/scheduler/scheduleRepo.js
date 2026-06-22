const { v4: uuidv4 } = require('uuid');
const Supabase = require('../../services/supabaseService');
const { getCurrentUserId } = require('../../middleware/requestContext');

const TABLE = 'schedules';

function fromRow(row) {
  if (!row) return null;
  const task = row.task_data && typeof row.task_data === 'object' ? row.task_data : {};
  return {
    ...task,
    id: row.id,
    userId: row.user_id,
    cron: row.cron_expr || task.cron,
    status: task.status || (row.is_active ? 'active' : 'paused'),
    nextRun: row.next_run || task.nextRun || null,
    lastRun: task.lastRun || null,
    qstashScheduleId: task.qstashScheduleId || null,
    qstashMessageId: task.qstashMessageId || null,
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
    cron,
    cron_expr,
    status,
    nextRun,
    lastRun,
    qstashScheduleId,
    qstashMessageId,
    createdAt,
    updatedAt,
    ...rest
  } = schedule;
  const isActive = status !== 'paused' && status !== 'archived';
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id || getCurrentUserId(),
    cron_expr: cron_expr || cron || '0 9 * * 1',
    next_run: nextRun || null,
    is_active: isActive,
    task_data: {
      ...rest,
      cron: cron_expr || cron,
      status: status || (isActive ? 'active' : 'paused'),
      nextRun: nextRun || null,
      lastRun: lastRun || null,
      qstashScheduleId: qstashScheduleId || null,
      qstashMessageId: qstashMessageId || null,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

class ScheduleRepo {
  async readAll(userId) {
    const uid = userId || getCurrentUserId();
    const { data, error } = uid
      ? await Supabase.select(TABLE, {}, uid)
      : await Supabase.selectAll(TABLE);
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async readById(id, userId) {
    const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
    if (error) throw error;
    return fromRow(data);
  }

  async create(item, userId) {
    const row = toRow(item, userId);
    const { data, error } = await Supabase.insert(TABLE, row, row.user_id);
    if (error) throw error;
    return fromRow(data?.[0] || row);
  }

  async update(id, updates, userId) {
    const current = await this.readById(id, userId);
    if (!current) {
      throw new Error(`Record with ID '${id}' was not found in schedules.`);
    }
    const row = toRow({ ...current, ...updates, id }, userId || current.userId);
    const { data, error } = await Supabase.update(
      TABLE,
      { id },
      {
        cron_expr: row.cron_expr,
        next_run: row.next_run,
        is_active: row.is_active,
        task_data: row.task_data,
        updated_at: new Date().toISOString(),
      },
      row.user_id,
    );
    if (error) throw error;
    return fromRow(data[0] || row);
  }

  async delete(id, userId) {
    const current = await this.readById(id, userId);
    const { data, error } = await Supabase.delete(TABLE, { id }, current?.user_id || userId);
    if (error) throw error;
    return data ? data.length : 0;
  }

  async getGlobal(id) {
    const { data, error } = await Supabase.selectOne(TABLE, { id });
    if (error) throw error;
    return fromRow(data);
  }

  async updateGlobal(id, updates) {
    const current = await this.getGlobal(id);
    if (!current) return null;
    return this.update(id, updates, current.userId);
  }
}

module.exports = new ScheduleRepo();
