/**
 * Supabase-backed repository base for user-scoped array stores.
 * Replaces the legacy fileStore/BaseRepository pattern.
 */
const { v4: uuidv4 } = require('uuid');
const Supabase = require('../../services/supabaseService');

class SupabaseRepository {
  constructor(table, options = {}) {
    this.table = table;
    this.payloadField = options.payloadField || 'metadata';
    this.schema = options.schema || null;
    this.userIdField = options.userIdField || 'user_id';
  }

  _fromRow(row) {
    if (!row) return null;
    const payload = row[this.payloadField] || {};
    const {
      id,
      user_id: userId,
      created_at: createdAt,
      updated_at: updatedAt,
      ...topLevel
    } = row;
    return {
      ...payload,
      ...topLevel,
      id,
      userId: userId || payload.userId,
      createdAt: payload.createdAt || createdAt,
      updatedAt: payload.updatedAt || updatedAt,
    };
  }

  _toRow(item, userId) {
    const now = new Date().toISOString();
    const {
      id,
      userId: itemUserId,
      user_id,
      createdAt,
      updatedAt,
      ...rest
    } = item;
    return {
      id: id || uuidv4(),
      [this.userIdField]: userId || itemUserId || user_id,
      [this.payloadField]: {
        ...rest,
        createdAt: createdAt || now,
        updatedAt: updatedAt || now,
      },
      created_at: createdAt || now,
      updated_at: now,
    };
  }

  async readAll(userId) {
    const { data, error } = await Supabase.select(this.table, {}, userId);
    if (error) throw error;
    return (data || []).map((row) => this._fromRow(row));
  }

  async readById(id, userId) {
    const { data, error } = await Supabase.selectOne(this.table, { id }, userId);
    if (error) throw error;
    return this._fromRow(data);
  }

  async create(item, userId) {
    const payload = { ...item };
    if (this.schema) this.schema.validate(payload);
    const row = this._toRow(payload, userId);
    const { data, error } = await Supabase.insert(this.table, row, userId);
    if (error) throw error;
    return this._fromRow(data?.[0] || row);
  }

  async update(id, updates, userId) {
    const current = await this.readById(id, userId);
    if (!current) {
      throw new Error(`Record with ID '${id}' was not found in ${this.table}.`);
    }
    const merged = { ...current, ...updates };
    if (this.schema) this.schema.validate(merged);
    const row = this._toRow(merged, userId);
    const { data, error } = await Supabase.update(
      this.table,
      { id },
      {
        [this.payloadField]: row[this.payloadField],
        updated_at: new Date().toISOString(),
      },
      userId,
    );
    if (error) throw error;
    return this._fromRow(data[0] || row);
  }

  async delete(id, userId) {
    const { data, error } = await Supabase.delete(this.table, { id }, userId);
    if (error) throw error;
    return data ? data.length : 0;
  }
}

module.exports = SupabaseRepository;
