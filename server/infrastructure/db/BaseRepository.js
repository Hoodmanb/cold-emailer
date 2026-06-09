/**
 * CareerBot Abstract Base Repository Class
 * Consolidates dynamic user scoping, schema validations,
 * and standard CRUD operations into a single reusable component.
 */
const fileStore = require('../../utils/fileStore');
const { OBJECT_FILES, defaultFor } = fileStore;
const { ensureArray } = require('../../utils/jsonNormalizer');

class BaseRepository {
  constructor(filename, schemaValidator = null) {
    this.filename = filename;
    this.schema = schemaValidator;
    this.isObjectStore = OBJECT_FILES.has(filename);
  }

  /**
   * Retrieves all records (array store) or the user object (object store) scoped to userId.
   */
  readAll(userId) {
    const raw = fileStore.read(this.filename, userId);
    if (this.isObjectStore) {
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
      return defaultFor(this.filename);
    }
    return ensureArray(raw);
  }

  /**
   * Retrieves a single record by ID.
   */
  readById(id, userId) {
    if (!id) return null;
    const list = this.readAll(userId);
    if (!Array.isArray(list)) return null;
    return list.find((item) => String(item.id) === String(id)) || null;
  }

  /**
   * Appends a new validated entity record.
   */
  create(item, userId) {
    const payload = { ...item };
    if (this.schema) {
      this.schema.validate(payload);
    }
    return fileStore.append(this.filename, payload, userId);
  }

  /**
   * Updates an existing validated record by ID.
   */
  update(id, updates, userId) {
    if (!id) throw new Error('Cannot update entity: Missing ID parameter.');

    const current = this.readById(id, userId);
    if (!current) {
      throw new Error(`Record with ID '${id}' was not found in ${this.filename}.`);
    }

    const merged = { ...current, ...updates };
    if (this.schema) {
      this.schema.validate(merged);
    }

    const result = fileStore.update(
      this.filename,
      (item) => String(item.id) === String(id),
      () => updates,
      userId,
    );

    if (!result) {
      throw new Error(`Failed to commit update modifications on record ID '${id}'.`);
    }
    return result;
  }

  /**
   * Removes a record by ID.
   */
  delete(id, userId) {
    if (!id) return 0;
    return fileStore.remove(this.filename, (item) => String(item.id) === String(id), userId);
  }
}

module.exports = BaseRepository;
