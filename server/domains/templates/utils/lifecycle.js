/**
 * Unified template lifecycle states.
 * Maps legacy approvalStatus/status booleans to canonical lifecycle.
 */

const LIFECYCLE = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
});

/** Legacy pending_approval → submitted */
function normalizeLifecycleStatus(raw) {
  const s = String(raw || 'draft').toLowerCase().trim();
  if (s === 'pending_approval' || s === 'pending') return LIFECYCLE.SUBMITTED;
  if (Object.values(LIFECYCLE).includes(s)) return s;
  return LIFECYCLE.DRAFT;
}

function resolveLifecycle(template = {}) {
  const status = normalizeLifecycleStatus(
    template.lifecycle || template.approvalStatus || template.status,
  );

  if (status === LIFECYCLE.APPROVED && (template.isPublic || template.isAdminTemplate)) {
    return LIFECYCLE.PUBLISHED;
  }
  if (template.archived === true) return LIFECYCLE.ARCHIVED;
  return status;
}

/** Map canonical lifecycle back to legacy fields for DB compatibility */
function toLegacyApprovalFields(lifecycle) {
  const lc = normalizeLifecycleStatus(lifecycle);
  switch (lc) {
    case LIFECYCLE.SUBMITTED:
      return { status: 'pending_approval', approvalStatus: 'pending_approval', lifecycle: lc };
    case LIFECYCLE.APPROVED:
    case LIFECYCLE.PUBLISHED:
      return { status: 'approved', approvalStatus: 'approved', lifecycle: lc };
    case LIFECYCLE.REJECTED:
      return { status: 'rejected', approvalStatus: 'rejected', lifecycle: lc };
    case LIFECYCLE.ARCHIVED:
      return { status: 'archived', approvalStatus: 'archived', lifecycle: lc, archived: true };
    default:
      return { status: 'draft', approvalStatus: 'draft', lifecycle: LIFECYCLE.DRAFT };
  }
}

function isUsableInGeneration(template) {
  const lc = resolveLifecycle(template);
  return (
    lc === LIFECYCLE.APPROVED ||
    lc === LIFECYCLE.PUBLISHED ||
    (lc === LIFECYCLE.DRAFT && !template.isPublic)
  );
}

module.exports = {
  LIFECYCLE,
  normalizeLifecycleStatus,
  resolveLifecycle,
  toLegacyApprovalFields,
  isUsableInGeneration,
};
