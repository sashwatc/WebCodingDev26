/**
 * Shared Framer Motion presets for the Recovery Archive visual system.
 * App.jsx wraps the tree in MotionConfig reducedMotion="user".
 *
 * Container props (initial/animate/variants) must be spread on the parent.
 * Child motion nodes use staggerChildVariants via variants={...} only.
 */

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: "easeOut" },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.24, ease: "easeOut" },
};

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

export const staggerChildVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

export const cardLift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.995 },
  transition: { duration: 0.18, ease: "easeOut" },
};

export const caseFileExpand = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.28, ease: "easeOut" },
};
