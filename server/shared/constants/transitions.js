/**
 * CareerBot Centralized Finite State Machine (FSM) Transition Systems
 */
const { TransitionError } = require('../errors/customErrors');

const EMAIL_TRANSITIONS = {
  draft: ['approved'],
  approved: ['queued'],
  queued: ['sent', 'failed'],
  failed: ['queued', 'void'],
  sent: [],
  void: []
};

const SCHEDULE_TRANSITIONS = {
  active: ['paused', 'completed'],
  paused: ['active'],
  completed: []
};

const WORKFLOW_TRANSITIONS = {
  pending: ['running'],
  running: ['completed', 'failed'],
  failed: ['running'],
  completed: []
};

class TransitionService {
  /**
   * Evaluates if an entity transition is valid.
   */
  static canTransition(fromStatus, toStatus, fsmMap) {
    // Treat undefined or initial empty state as valid transition to target
    const current = fromStatus || 'draft';
    const allowed = fsmMap[current];
    if (!allowed) return false;
    return allowed.includes(toStatus);
  }

  /**
   * Enforces transition constraints. Throws a TransitionError if blocked.
   */
  static enforceTransition(entityId, fromStatus, toStatus, fsmMap) {
    if (fromStatus === toStatus) return; // No-op
    if (!this.canTransition(fromStatus, toStatus, fsmMap)) {
      throw new TransitionError(
        `Invalid status mutation path for entity '${entityId}': cannot transition from '${fromStatus || 'initial'}' to '${toStatus}'`,
        fromStatus,
        toStatus
      );
    }
  }
}

module.exports = {
  EMAIL_TRANSITIONS,
  SCHEDULE_TRANSITIONS,
  WORKFLOW_TRANSITIONS,
  TransitionService
};
