// server/tests/mocks/aiMock.js
// Simple mock for AI provider interactions used in tests

function detectTemplateKind(template) {
  // For test purposes, just return 'hybrid' if both content and aiRules are present
  if (template && template.content && template.aiRules) return 'hybrid';
  return 'static';
}

function generatePreviewPages(template) {
  // Return a dummy preview result
  return [{ page: 1, html: '<html><body>Preview</body></html>' }];
}

module.exports = {
  detectTemplateKind,
  generatePreviewPages,
};
