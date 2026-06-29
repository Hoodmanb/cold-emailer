import { Variants } from 'framer-motion';
import { EASING, TIMING, SPRINGS } from './motionTokens';

// ─── Page-level ──────────────────────────────────────────────────────────────

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TIMING.normal, ease: EASING.easeStandard }
  },
  exit: {
    opacity: 0,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRINGS.medium
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

// ─── List / stagger containers ────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRINGS.snappy
  }
};

// ─── Cards ────────────────────────────────────────────────────────────────────

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRINGS.medium
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

// ─── Hover / tap micro-interactions ──────────────────────────────────────────

export const scaleHoverVariants = {
  hover: {
    scale: 1.015,
    y: -2,
    transition: { duration: 0.15, ease: 'easeOut' }
  },
  tap: { scale: 0.985 }
};

export const cardHoverVariants = {
  rest: { y: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  hover: {
    y: -4,
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    transition: { duration: 0.2, ease: EASING.easeEnter }
  },
  tap: {
    y: -1,
    scale: 0.995,
    transition: { duration: 0.1 }
  }
};

export const buttonVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: EASING.easeEnter }
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.08 }
  }
};

// ─── Badge / Chip ─────────────────────────────────────────────────────────────

export const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRINGS.bounce
  }
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TIMING.fast, ease: EASING.easeStandard }
  },
  exit: {
    opacity: 0,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRINGS.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 8,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

// ─── Snackbar / Toast ─────────────────────────────────────────────────────────

export const snackbarVariants: Variants = {
  hidden: { opacity: 0, x: 80, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: SPRINGS.snappy
  },
  exit: {
    opacity: 0,
    x: 80,
    scale: 0.95,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

// ─── Activity / list rows ─────────────────────────────────────────────────────

export const listRowVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRINGS.snappy
  }
};

// ─── Pipeline step circles ────────────────────────────────────────────────────

export const pipelineStepVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { ...SPRINGS.bounce, delay: i * 0.08 }
  })
};
