export const TIMING = {
  instant: 0.08,
  ultraFast: 0.12,
  fast: 0.18,
  normal: 0.25,
  slow: 0.35,
  hero: 0.60
} as const;

export const EASING = {
  easeStandard: [0.2, 0, 0, 1],
  easeEnter: [0.16, 1, 0.3, 1],
  easeExit: [0.7, 0, 0.84, 0],
  easeBounce: [0.34, 1.56, 0.64, 1],
  easeElastic: [0.25, 1.25, 0.5, 1]
} as const;

export const SPRINGS = {
  soft: { type: "spring", stiffness: 180, damping: 28, mass: 1.0 },
  medium: { type: "spring", stiffness: 260, damping: 22, mass: 0.9 },
  snappy: { type: "spring", stiffness: 390, damping: 30, mass: 0.8 },
  heavy: { type: "spring", stiffness: 140, damping: 24, mass: 1.8 },
  bounce: { type: "spring", stiffness: 320, damping: 15, mass: 0.75 }
} as const;

