require('./_setup.js');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractPlaceholders,
  validatePlaceholders,
  fillPlaceholders,
  detectTemplateKind,
} = require('../utils/placeholderParser');
const { generatePreviewPages } = require('../services/templates/previewGenerator');

test('extractPlaceholders finds template variables', () => {
  const result = extractPlaceholders('Hello {{name}} at {{company}}');
  assert.deepEqual(result, ['name', 'company']);
});

test('validatePlaceholders rejects unknown keys', () => {
  const result = validatePlaceholders('Hello {{unknownField}}');
  assert.equal(result.valid, false);
  assert.deepEqual(result.unknown, ['unknownField']);
});

test('fillPlaceholders replaces values', () => {
  const output = fillPlaceholders('Dear {{name}}', { name: 'Jane' });
  assert.equal(output, 'Dear Jane');
});

test('detectTemplateKind identifies hybrid templates', () => {
  const kind = detectTemplateKind({
    content: 'Hello {{name}}',
    aiRules: 'Keep concise',
    structure: ['Header'],
  });
  assert.equal(kind, 'hybrid');
});

test('attachment parent types include email and schedule flows', () => {
  const { VALID_PARENT_TYPES } = require('../modules/documents/attachments/repository');
  assert.ok(VALID_PARENT_TYPES.has('email_template'));
  assert.ok(VALID_PARENT_TYPES.has('schedule'));
  assert.ok(VALID_PARENT_TYPES.has('mail_widget'));
});
