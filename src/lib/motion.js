/**
 * Shared Framer Motion presets for the Recovery Archive visual system.
 * App.jsx wraps the tree in MotionConfig reducedMotion="user".
 *
 * Container props (initial/animate/variants) must be spread on the parent.
 * Child motion nodes use staggerChildVariants via variants={...} only.
 */

// Fade in while sliding up 10px. Spread onto a motion element via {...fadeUp}.
export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: "easeOut" },
};

// Simple opacity fade-in. Spread onto a motion element via {...fadeIn}.
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.24, ease: "easeOut" },
};

// Parent container props that orchestrate staggered reveal of children.
// Spread on the parent; children use `staggerChildVariants` for their motion.
export const staggerContainerProps = {
  initial: "hidden",
  animate: "visible",
  variants: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05, delayChildren: 0.04 },
    },
  },
};

// Variants for children inside a stagger container; pass via variants={...}.
export const staggerChildVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

// Subtle interactive lift/press feedback for clickable cards.
export const cardLift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.995 },
  transition: { duration: 0.18, ease: "easeOut" },
};

// Expand/collapse preset for "case file" sections; animates height + opacity,
// including an exit state for use with AnimatePresence.
export const caseFileExpand = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.28, ease: "easeOut" },
};
