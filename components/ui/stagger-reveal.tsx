"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * StaggerReveal — a container that reveals its <Reveal> children in sequence
 * (y + opacity), the framer-motion counterpart of the CSS `scanui-rise` /
 * `scanstory-ent` staggers. Replaces the ad-hoc `animationDelay` inline chains
 * and `setTimeout` boolean-gate reveal logic with one API. Fully no-op under
 * `prefers-reduced-motion`.
 */

interface StaggerRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay between each child's entrance (seconds). Default 0.06. */
  stagger?: number;
  /** Delay before the first child (seconds). Default 0.04. */
  delayChildren?: number;
  /** Animate every mount (default) vs. only when scrolled into view. */
  whileInView?: boolean;
}

const containerVariants = (stagger: number, delayChildren: number): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 30 },
  },
};

export function StaggerReveal({
  stagger = 0.06,
  delayChildren = 0.04,
  whileInView = false,
  children,
  ...rest
}: StaggerRevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div {...rest}>{children}</div>;
  }
  const animateProps = whileInView
    ? { whileInView: "show" as const, viewport: { once: true, margin: "-10% 0px" } }
    : { animate: "show" as const };
  return (
    <motion.div
      initial="hidden"
      variants={containerVariants(stagger, delayChildren)}
      {...animateProps}
      {...(rest as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child. Must be a direct child of <StaggerReveal>. */
export function Reveal({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div {...rest}>{children}</div>;
  }
  return (
    <motion.div variants={itemVariants} {...(rest as React.ComponentProps<typeof motion.div>)}>
      {children}
    </motion.div>
  );
}
