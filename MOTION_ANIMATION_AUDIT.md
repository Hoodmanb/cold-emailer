# CareerBot AI — Motion Design System & UX Audit Specification

This document serves as the absolute single source of truth for the animation design system, motion architecture, and interactive physics of the CareerBot AI Job Automation Platform. It aligns design intent with engineering execution, providing a production-ready framework inspired by industry benchmarks such as **Linear, Stripe, Vercel, Framer, and Arc Browser**.

---

## Table of Contents
1. [Motion Design Philosophy & Principles](#1-motion-design-philosophy--principles)
2. [Motion Design Tokens System](#2-motion-design-tokens-system)
3. [Component-Driven Audit & Micro-Interactions](#3-component-driven-audit--micro-interactions)
4. [AI Motion Design Language](#4-ai-motion-design-language)
5. [Project Code Architecture (`src/motion/`)](#5-project-code-architecture-srcmotion)
6. [Shared Animation Library (Framer Motion Code Templates)](#6-shared-animation-library-framer-motion-code-templates)
7. [Cinematic Landing Page Scroll Choreography](#7-cinematic-landing-page-scroll-choreography)
8. [Delight Moments ("Moments Users Will Remember")](#8-delight-moments-moments-users-will-remember)
9. [Accessibility & Reduced Motion](#9-accessibility--reduced-motion)
10. [Performance Budget & Profiling Benches](#10-performance-budget--profiling-benches)
11. [Page & Component Motion Scores (Audit Checklist)](#11-page--component-motion-scores-audit-checklist)
12. [Future Vision & Premium Enhancements](#12-future-vision--premium-enhancements)
13. [Implementation Roadmap](#13-implementation-roadmap)

---

## 1. Motion Design Philosophy & Principles

In CareerBot, motion is a core usability feature. It is a spatial language that guides attention, clarifies UI hierarchy, and establishes continuity across complex asynchronous AI sequences.

*   **Explain, Don't Decorate**: Every translation, scale, or opacity shift must map directly to a user action, structural shift, or state transition.
*   **Responsiveness Over Spectacle**: Micro-interactions must feel instantaneous. Visual feedback (e.g., button taps or hover states) must begin within **80ms**.
*   **Physics-Based Springs Over Sluggish Easings**: Linear and simple ease-in curves feel artificial. We utilize damped spring physics for spatial elements to simulate natural weight, friction, and momentum.
*   **Keep It Lightweight**: Maintain a solid 60fps (and 120Hz on modern displays). We animate only GPU-accelerated CSS properties (`transform`, `opacity`, `filter`). We strictly avoid properties that trigger browser reflow/layout cycles (`width`, `height`, `top`, `left`, `margin`).
*   **Consistent Motion Branding**: All animations across pages, modals, and elements must draw from the same predefined design tokens.

---

## 2. Motion Design Tokens System

To maintain consistency, all animations must reference these unified design tokens instead of using hardcoded values.

### 2.1. Timing Tokens (for duration-based transitions)
```
token.duration.instant    = 80ms    // Extreme micro-feedback (checkboxes, taps)
token.duration.ultraFast   = 120ms   // Snappy hover reactions, tooltips
token.duration.fast       = 180ms   // Dropdowns, selects, small popovers
token.duration.normal     = 250ms   // Default modal slide-ins, page transitions
token.duration.slow       = 350ms   // Complex sidebar slides, multi-step layout transitions
token.duration.hero       = 600ms   // Landing page scroll triggers, brand reveals
```

### 2.2. Easing Curve Tokens
```
token.easing.easeStandard = cubic-bezier(0.2, 0, 0, 1)        // Standard fluid movement
token.easing.easeEnter    = cubic-bezier(0.16, 1, 0.3, 1)     // Snappy entry (easeOutExpo)
token.easing.easeExit     = cubic-bezier(0.7, 0, 0.84, 0)     // Accelerated exit (easeInExpo)
token.easing.easeBounce   = cubic-bezier(0.34, 1.56, 0.64, 1)  // Expressive overshoot (easeOutBack)
token.easing.easeElastic  = cubic-bezier(0.25, 1.25, 0.5, 1)   // Soft rebound curve
```

### 2.3. Spring Configuration Tokens
For interactive elements (drag, scale, click feedback) where duration is determined by physics:
```
token.spring.soft   = { type: "spring", stiffness: 180, damping: 28, mass: 1.0 }  // Floating, fluid modals
token.spring.medium = { type: "spring", stiffness: 260, damping: 22, mass: 0.9 }  // Default card moves, list layout
token.spring.snappy = { type: "spring", stiffness: 390, damping: 30, mass: 0.8 }  // Hover scaling, taps, drag handle lifts
token.spring.heavy  = { type: "spring", stiffness: 140, damping: 24, mass: 1.8 }  // Inertial sidebar moves
token.spring.bounce = { type: "spring", stiffness: 320, damping: 15, mass: 0.75 } // Playful overshoots (congratulatory alerts)
```

### 2.4. Transform & Spatial Tokens
```
token.scale.hover   = 1.015     // Desktop hover feedback scale
token.scale.tap     = 0.985     // Pressed state scale
token.rotate.active = 180deg    // Accordion chevron rotation
token.distance.sm   = 8px       // Popover entrance translation
token.distance.md   = 16px      // Page transition translation
token.distance.lg   = 32px      // Modal slide-in translation
```

---

## 3. Component-Driven Audit & Micro-Interactions

Every reusable UI element must be designed with responsive, natural feedback:

```
[User Action] ──► (Instant Spring Scale/Color Feedback)
                        │
                        ▼
             (Target Interaction Triggered) ──► [Accelerated Exit / Transition]
```

### 3.1. Navigation Components
*   **Sidebar Collapse**: 
    - *Current*: Immediate snapping width transition.
    - *Target*: Fluid structural width and icon label fading. Wrap elements in `<motion.div layout>` using `token.spring.fluid`. Label elements fade (`opacity: 0 -> 1`) with `token.duration.snappy`.
*   **Tabs (Sub-navigation)**:
    - *Current*: Snaps instantly between tabs.
    - *Target*: Slider indicator transition. Use `layoutId="activeTab"` on a shared indicator background panel. Fades and translates dynamically behind text.
*   **Breadcrumbs & Links**:
    - *Current*: Standard browser style.
    - *Target*: Soft color hover transition + scale factor. Focus highlights use a ring expansion offset (`2px`).

### 3.2. Button Interactions
*   **Primary Button**:
    - *Hover*: Scales up (`1.015`), raises shadow (`0px 4px 12px rgba(99, 102, 241, 0.2)`).
    - *Active*: Scales down (`0.985`), contracts shadow.
    - *Loading*: Background shifts to a shimmering gradient mask while text fades out (`opacity: 0`) and a spinner rotates in.
*   **IconButton**:
    - *Hover*: Scales up (`1.05`), background fades in (`rgba(255,255,255,0.06)`).
    - *Active*: Scales down (`0.95`).
*   **Keyboard Focus (All Buttons)**:
    - Renders a concentric outer glow border expanding outwards by `3px` using `token.spring.snappy`.

### 3.3. Form Elements
*   **TextField & TextArea**:
    - *Focus*: Label shrinks and translates up by `-10px` (`token.spring.snappy`). Input border morphs smoothly.
    - *Validation Error*: Horizontal shake keyframe sequence (`x: [-6, 6, -4, 4, 0]`) with border color shifting to emergency red.
*   **Select / Multi-Select Dropdowns**:
    - *Open*: Popover scales from origin anchor (`0.97 -> 1.0`, `opacity: 0 -> 1`) with `token.spring.medium`.
    - *Selection*: Checked items highlight with a spring checkmark scale-in.
*   **Drag & Drop File Upload**:
    - *Drag Over*: Dropping area scales up (`1.02`), dashes animate inward via dashed border offsets, and a hover overlay glows.
    - *Upload Success*: The upload card spins 3D along the Y-axis (`rotateY: 0 -> 180deg`) to reveal completion metrics.

### 3.4. Overlays & Dialogs
*   **Modals & Dialogs**:
    - *Entry*: Scrim background fades in (`opacity: 0 -> 0.4`). Content container springs up (`y: 20px -> 0`, `scale: 0.95 -> 1`) using `token.spring.soft`.
    - *Exit*: Container falls down (`y: 12px`, `scale: 0.96`, `opacity: 0`).
*   **Tooltips & Popovers**:
    - *Entry*: Translates up (`y: 6px -> 0`, `opacity: 0 -> 1`) with `token.duration.ultraFast`.

### 3.5. Feedback & Toast Snackbars
*   **Toast Notifications**:
    - *Entrance*: Slides in from corner (`x: 100% -> 0` or `y: -30px -> 0`) with `token.spring.bounce`.
    - *Exit*: Slides out of viewport horizontally with `token.easing.easeExit`.

---

## 4. AI Motion Design Language

As an AI-first workspace, CareerBot communicates processing states using distinct visual feedback:

```
┌─────────────┐       (Initiate AI task)       ┌───────────────┐
│   IDLE STATE│ ─────────────────────────────► │ THINKING GLOW │
└─────────────┘                                └───────────────┘
       ▲                                               │
       │                                               ▼
┌─────────────┐      (Sequential text reveal)  ┌───────────────┐
│   SUCCESS   │ ◄───────────────────────────── │   STREAMING   │
└─────────────┘                                └───────────────┘
```

### 4.1. AI States & Behaviors
*   **Idle**: A subtle, slow glowing orb or pulsing halo behind the AI icon (`scale: 1.0 -> 1.03`, opacity: `0.7 -> 1.0`) looping every 4 seconds.
*   **Thinking**: A multi-color metallic gradient mesh mask translating across the card boundary.
    - *Formula*: Linear gradient moving `background-position` horizontally (`0% -> 200%`) over a `2s` loop, combined with a vertical pulsing wave.
*   **Streaming & Typing**: Rather than character-by-character updates, text blocks fade and slide up sequentially to mimic natural reading flow.
    - *Formula*: Text blocks render with a stagger delay of `40ms`, fading in (`0 -> 1`) and sliding up (`y: 8px -> 0`).
*   **ATS Scan**: A neon-indigo horizontal laser line translating down the target document container, leaving a blurred trailing path.
*   **Mock Interview Voice State**: A real-time responsive SVG wave visualizer that scales dynamically based on microphone volume values.
    - *Formula*: 3 SVG path waves scale along the Y-axis using spring constraints.

---

## 5. Project Code Architecture (`src/motion/`)

To implement this design system, the codebase must structure motion assets under a dedicated `src/motion/` directory:

```
src/
└── motion/
    ├── motionTokens.ts        # Defines duration, ease, spring, and transform constants
    ├── transitions.ts         # Preconfigured framer-motion transition templates
    ├── variants.ts            # Exported Framer Motion variant libraries (fade, slide, stagger)
    ├── presets.ts             # Direct configuration objects (hover scales, click bounds)
    ├── pageTransitions.tsx    # Page transition component wrappers
    ├── layoutAnimations.ts    # Reusable layout ID animations
    ├── gestures.ts            # Motion handler settings for drags and drops
    ├── hooks/
    │   ├── useReducedMotion.ts # Custom hook checks media query and fallback states
    │   ├── usePageTransition.ts # Triggers routes with delay for exit animations
    │   └── useStagger.ts      # Computes variable staggered indices
    └── components/
        ├── MotionWrapper.tsx  # Dynamic component injector for framer-motion props
        ├── FadeIn.tsx         # Out-of-the-box viewport entrance wrapper
        ├── SlideUp.tsx        # Out-of-the-box scroll slide up wrapper
        ├── AnimatedCounter.tsx# Number incrementing utility hook wrapper
        └── PageTransition.tsx # Shared layout page transition hook
```

---

## 6. Shared Animation Library (Framer Motion Code Templates)

Below are the production-ready code blocks to be populated in `src/motion/`:

### 6.1. `src/motion/motionTokens.ts`
```typescript
export const TIMING = {
  instant: 0.08,
  ultraFast: 0.12,
  fast: 0.18,
  normal: 0.25,
  slow: 0.35,
  hero: 0.60
};

export const EASING = {
  easeStandard: [0.2, 0, 0, 1],
  easeEnter: [0.16, 1, 0.3, 1],
  easeExit: [0.7, 0, 0.84, 0],
  easeBounce: [0.34, 1.56, 0.64, 1],
  easeElastic: [0.25, 1.25, 0.5, 1]
};

export const SPRINGS = {
  soft: { type: "spring", stiffness: 180, damping: 28, mass: 1.0 },
  medium: { type: "spring", stiffness: 260, damping: 22, mass: 0.9 },
  snappy: { type: "spring", stiffness: 390, damping: 30, mass: 0.8 },
  heavy: { type: "spring", stiffness: 140, damping: 24, mass: 1.8 },
  bounce: { type: "spring", stiffness: 320, damping: 15, mass: 0.75 }
};
```

### 6.2. `src/motion/variants.ts`
```typescript
import { Variants } from 'framer-motion';
import { EASING, TIMING, SPRINGS } from './motionTokens';

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRINGS.medium
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: TIMING.fast, ease: EASING.easeExit }
  }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};
```

### 6.3. `src/motion/components/AnimatedCounter.tsx`
```tsx
import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1.0 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 15 });

  useEffect(() => {
    const controls = animate(motionValue, value, { duration });
    return () => controls.stop();
  }, [value, motionValue, duration]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toLocaleString();
      }
    });
  }, [springValue]);

  return <span ref={ref} />;
};
```

---

## 7. Cinematic Landing Page Scroll Choreography

The landing page must guide the user through a cinematic scroll sequence:

```
[Hero: 3D perspective tilt] ──► [Logos: Staggered reveal] ──► [Problem: Zoom out fold]
                                                                        │
                                                                        ▼
[Pricing: Scale Pop] ◄── [Testimonials: Infinite loop] ◄── [AI Demo: Interactive run]
```

### 7.1. Hero Section Sequence
*   **Entrance**: Hero text, subheadings, and primary action buttons stagger-fade up (`y: 35px -> 0`) using `token.spring.soft`.
*   **Scroll Transform**: The landing page dashboard mock image starts with a 3D perspective rotation tilt (`rotateX: 18deg`, `scale: 0.95`). As the user scrolls, it rotates flat to `rotateX: 0deg` and scales to `1.02` dynamically.
    - *Formula*: `rotateX = useTransform(scrollY, [0, 400], [18, 0])`.

### 7.2. Logos Section
*   **Scroll-Triggered Entry**: Logos slide in horizontally, fading in sequentially as they enter the viewport.

### 7.3. Problem Section
*   **Choreography**: Content slides in from left and right boundaries while background colors shift from dark slate to deep purple.

### 7.4. Interactive AI Demo Showcase
*   **Scroll Action**: Triggers an auto-typing sequence displaying a mock resume tailoring operation when the section is at `30%` viewport depth.

### 7.5. Feature Cards Grid
*   **Choreography**: Layout cards fade and slide up using a `staggerChildren` sequence.

---

## 8. Delight Moments ("Moments Users Will Remember")

These subtle interactions add polish to key application states:

### 8.1. Welcome Dashboard Greeting
- **Interaction**: The dashboard header ("Good morning, Joshua") fades in letter-by-letter over `800ms`. A small sun or moon icon rotates 45 degrees into view using a spring recoil.

### 8.2. Resume Upload Success Celebration
- **Interaction**: Dropping a PDF resume triggers an upload completion card that spins on its axis to reveal match analytics, followed by a subtle particle bloom.

### 8.3. Job Match High-Score Target Pop
- **Interaction**: If the ATS match engine returns a score above `85%`, the circular score ring flashes gold, triggering a subtle particle explosion.

### 8.4. Outreach Email Dispatched (Paper Airplane)
- **Interaction**: Pressing send translates the email card upward off-screen (`y: -200px`), scaling it down (`scale: 0.85`) to mimic a paper airplane flight, before displaying a success toast.

---

## 9. Accessibility & Reduced Motion

We must support users with motion sensitivities or low-powered devices.

### 9.1. Media Query Support (`prefers-reduced-motion`)
We implement global CSS constraints and React hooks to fallback cleanly:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    scroll-behavior: auto !important;
    transform: none !important;
  }
}
```

### 9.2. Code Fallback Wrapper (`useReducedMotion`)
```typescript
import { useReducedMotion as framerUseReducedMotion } from 'framer-motion';

export function useReducedMotionVariants(standard: any, fallback?: any) {
  const shouldReduce = framerUseReducedMotion();
  
  const defaultFallback = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.08 } }
  };

  return shouldReduce ? (fallback || defaultFallback) : standard;
}
```

---

## 10. Performance Budget & Profiling Benches

Motion must run at a smooth **60fps** (or **120fps** on high refresh-rate monitors). We enforce the following constraints:

*   **Concurrency Cap**: No more than **3** concurrent animations should run simultaneously (excluding background loop states).
*   **GPU Properties**: Only animate `transform`, `opacity`, and `filter`. Do not animate `width`, `height`, `margin`, or positioning properties (`top`, `left`, `right`, `bottom`).
*   **Virtualized Lists**: Large lists (such as job tables with over 50 rows) must use virtualization (e.g. `react-window`). Row entrance animations should only be applied to visible items.
*   **Canvas & WebGL for Particle Systems**: Confetti bursts must use a lightweight `<canvas>` particle loop rather than hundreds of separate DOM elements.
*   **Profiling Guidelines**: Keep Chrome DevTools Performance Monitor open during QA testing. Ensure **Layout & Reflow** metrics remain at **0** during transitions.

---

## 11. Page & Component Motion Scores

This table outlines current motion scores and target scores following the integration of the motion system:

| Page / Component | Target File | Current Score | Target Score | Missing Opportunities | Priority | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing Hero** | `fe/src/components/HeroSection.tsx` | `2.5 / 10` | `9.5 / 10` | 3D scroll tilt, perspective mock frame, stagger | High | High |
| **Dashboard Page** | `fe/src/app/dashboard/page.tsx` | `3.0 / 10` | `9.0 / 10` | Widget staggers, count-up numbers, welcome fade | High | Medium |
| **Job Pipelines** | `fe/src/app/dashboard/jobs/page.tsx`| `2.0 / 10` | `9.5 / 10` | Column layout transitions, lift shadow on drag | High | High |
| **ATS Score Ring** | `fe/src/components/layout/ScoreRing.tsx`| `1.5 / 10` | `9.8 / 10` | Spring circle dashoffset, high-score pop, count | High | Medium |
| **AI Tailor Panel**| `fe/src/components/layout/GeneratePanel.tsx`| `1.0 / 10` | `9.5 / 10` | Laser scan, stream fade, metallic glow background| High | High |
| **Email Sender** | `fe/src/components/layout/SendSingleEmail.tsx`| `1.5 / 10` | `8.5 / 10` | Card airplane exit, checkmark ripple effect | Medium | Medium |
| **Admin Panel** | `fe/src/app/dashboard/admin/page.tsx`| `1.0 / 10` | `7.0 / 10` | Table sorting transitions, status pulse | Low | Medium |

---

## 12. Future Vision & Premium Enhancements

These optional enhancements can further polish the application in future phases:

*   **Interactive Cursor Spotlight**: A radial gradient light background that follows the cursor coordinates on landing cards and primary dashboards.
*   **Mock Interview AI Avatar**: A responsive SVG abstract avatar that morphs its shape (speaking, listening, analyzing states) based on audio feedback.
*   **Dynamic Aura Background**: A subtle, slow-moving mesh background (aurora gradients) that coordinates with active workflow tasks.

---

## 13. Implementation Roadmap

```
[Phase 1: Foundation] ──► [Phase 2: Interactions] ──► [Phase 3: AI Orchestration] ──► [Phase 4: Polish]
 (Tokens & Transitions)      (Forms & Collapsibles)     (Laser Scan & Streaming)       ( confettis & Drags)
```

1.  **Phase 1 (Foundation)**: Set up `src/motion/` directory. Initialize tokens, variants, and global route wrappers.
2.  **Phase 2 (Micro-Interactions)**: Implement input focus animations, button springs, and dropdown transitions.
3.  **Phase 3 (AI States)**: Integrate the metallic thinking shimmer, laser scanning effect, and paragraph-level streaming transitions.
4.  **Phase 4 (Premium Features)**: Add the paper-airplane dispatch exit, high-score confetti pop, and pipeline drag-and-drop.
