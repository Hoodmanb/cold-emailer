const { v4: uuidv4 } = require('uuid');
const Supabase = require('../../services/supabaseService');
const { getCurrentUserId } = require('../../middleware/requestContext');

const TABLE = 'schedule_executions';

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    userId: row.user_id,
    messageId: row.message_id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error,
    retryCount: row.retry_count,
    ...meta,
  };
}

function toRow(execution, userId) {
  const now = new Date().toISOString();
  const {
    id,
    scheduleId,
    userId: uid,
    messageId,
    status,
    startedAt,
    finishedAt,
    error,
    retryCount,
    ...rest
  } = execution;
  return {
    id: id || uuidv4(),
    schedule_id: scheduleId,
    user_id: userId || uid || getCurrentUserId(),
    message_id: messageId || null,
    status: status || 'started',
    started_at: startedAt || now,
    finished_at: finishedAt || null,
    error: error || null,
    retry_count: retryCount || 0,
    metadata: rest,
    created_at: now,
  };
}

class ExecutionRepo {
  async readAll(userId) {
    const { data, error } = userId
      ? await Supabase.select(TABLE, {}, userId)
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
      throw new Error(`Record with ID '${id}' was not found in schedule_executions.`);
    }
    const merged = { ...current, ...updates };
    const row = toRow(merged, userId || current.userId);
    const { data, error } = await Supabase.update(
      TABLE,
      { id },
      {
        status: row.status,
        finished_at: row.finished_at,
        error: row.error,
        retry_count: row.retry_count,
        metadata: row.metadata,
      },
      row.user_id,
    );
    if (error) throw error;
    return fromRow(data[0] || row);
  }

  async delete(id, userId) {
    const { data, error } = await Supabase.delete(TABLE, { id }, userId);
    if (error) throw error;
    return data ? data.length : 0;
  }

  async listForSchedule(scheduleId) {
    const { data, error } = await Supabase.selectAll(TABLE, { schedule_id: scheduleId });
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async listAll() {
    return this.readAll();
  }
}

module.exports = new ExecutionRepo();
