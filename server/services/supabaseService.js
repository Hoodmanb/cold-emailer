// server/services/supabaseService.js
/**
 * Wrapper around the Supabase service-role client providing generic CRUD helpers.
 * Server-side operations bypass RLS via the service_role key.
 */
const supabase = require('../utils/supabaseClient');

const TABLES_WITHOUT_USER_ID = new Set([
  'profiles',
  'users',
  'credit_packs',
  'gateway_settings',
  'model_catalog',
  'model_pricing',
  'admin_smtp',
  'scheduler_idempotency',
  'template_preview_data',
]);

function withUserId(payload, userId, table) {
  if (!payload || !userId || TABLES_WITHOUT_USER_ID.has(table)) return payload;
  if (payload.user_id !== undefined) return payload;
  return { ...payload, user_id: userId };
}

function applyFilters(query, filter = {}) {
  let q = query;
  for (const [column, value] of Object.entries(filter)) {
    if (value === undefined) continue;
    q = q.eq(column, value);
  }
  return q;
}

module.exports = {
  supabase,

  async select(table, filter = {}, userId) {
    let query = supabase.from(table).select('*');
    if (userId && !TABLES_WITHOUT_USER_ID.has(table)) {
      query = query.eq('user_id', userId);
    }
    query = applyFilters(query, filter);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  async selectOne(table, filter = {}, userId) {
    const { data, error } = await module.exports.select(table, filter, userId);
    if (error) return { data: null, error };
    return { data: data[0] || null, error: null };
  },

  async selectAll(table, filter = {}) {
    let query = supabase.from(table).select('*');
    query = applyFilters(query, filter);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  async insert(table, payload, userId) {
    const rows = withUserId(payload, userId, table);
    const { data, error } = await supabase.from(table).insert(rows).select().single();
    return { data: data ? [data] : null, error };
  },

  async update(table, filter, payload, userId) {
    let query = supabase.from(table).update(payload);
    if (userId && !TABLES_WITHOUT_USER_ID.has(table)) {
      query = query.eq('user_id', userId);
    }
    query = applyFilters(query, filter);
    const { data, error } = await query.select();
    return { data: data || [], error };
  },

  async delete(table, filter, userId) {
    let query = supabase.from(table).delete();
    if (userId && !TABLES_WITHOUT_USER_ID.has(table)) {
      query = query.eq('user_id', userId);
    }
    query = applyFilters(query, filter);
    const { data, error } = await query.select();
    return { data: data || [], error };
  },

  async upsert(table, payload, userId, onConflict = 'id') {
    const rows = withUserId(payload, userId, table);
    const { data, error } = await supabase
      .from(table)
      .upsert(rows, { onConflict })
      .select()
      .single();
    return { data, error };
  },
};
