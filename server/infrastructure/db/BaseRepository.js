/**
 * CareerBot Abstract Base Repository Class
 * Consolidates dynamic user scoping, schema validations,
 * and standard CRUD operations into a single reusable component.
 */
const fileStore = require('../../utils/fileStore');

class BaseRepository {
  constructor(filename, schemaValidator = null) {
    this.filename = filename;
    this.schema = schemaValidator;
  }

  /**
   * Retrieves all records scoped to the current active user context.
   */
  readAll() {
    return fileStore.read(this.filename);
  }

  /**
   * Retrieves a single record by ID.
   */
  readById(id) {
    if (!id) return null;
    const list = this.readAll();
    return list.find((item) => String(item.id) === String(id)) || null;
  }

  /**
   * Appends a new validated entity record.
   */
  create(item) {
    const payload = { ...item };
    if (this.schema) {
      // Validate before write-ahead append
      this.schema.validate(payload);
    }
    return fileStore.append(this.filename, payload);
  }

  /**
   * Updates an existing validated record by ID.
   */
  update(id, updates) {
    if (!id) throw new Error('Cannot update entity: Missing ID parameter.');
    
    const current = this.readById(id);
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
      () => updates
    );

    if (!result) {
      throw new Error(`Failed to commit update modifications on record ID '${id}'.`);
    }
    return result;
  }

  /**
   * Removes a record by ID.
   */
  delete(id) {
    if (!id) return 0;
    return fileStore.remove(this.filename, (item) => String(item.id) === String(id));
  }
}

module.exports = BaseRepository;
