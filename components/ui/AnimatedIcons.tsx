import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { motion, useAnimation, useReducedMotion, Variants, HTMLMotionProps } from 'framer-motion';

// --- Helper for class names since lib/utils doesn't exist ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// --- DashboardIcon (User Provided Code) ---
export interface DashboardIconHandle {
 startAnimation: () => void;
 stopAnimation: () => void;
}

interface DashboardIconProps extends HTMLMotionProps<"div"> {
 size?: number;
 duration?: number;
 isAnimated?: boolean;
 isActive?: boolean; // Added for compatibility with existing AnimatedIcons usage
}

const DashboardIcon = forwardRef<DashboardIconHandle, DashboardIconProps>(
 (
  {
   onMouseEnter,
   onMouseLeave,
   className,
   size = 24,
   duration = 0.6,
   isAnimated = true,
   isActive, // Use this prop to trigger animation
   ...props
  },
  ref,
 ) => {
  const controls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  // Trigger animation based on isActive prop
  React.useEffect(() => {
    if (isActive) {
      if (reduced) {
        controls.start("normal");
      } else {
        controls.start("animate");
      }
    } else {
        controls.start("normal");
    }
  }, [isActive, controls, reduced]);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () =>
     reduced ? controls.start("normal") : controls.start("animate"),
    stopAnimation: () => controls.start("normal"),
   };
  });

  const handleEnter = useCallback(
   (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) controls.start("animate");
    else onMouseEnter?.(e as any);
   },
   [controls, reduced, isAnimated, onMouseEnter],
  );

  const handleLeave = useCallback(
   (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isControlled.current) controls.start("normal");
    else onMouseLeave?.(e as any);
   },
   [controls, onMouseLeave],
  );

  const iconVariants: Variants = {
   normal: { scale: 1, rotate: 0 },
   animate: {
    scale: [1, 1.06, 0.98, 1],
    rotate: [0, -1.5, 1.5, 0],
    transition: { duration: 1.1 * duration, ease: "easeInOut" },
   },
  };

  const tileVariants: Variants = {
   normal: { opacity: 1, scale: 1, y: 0 },
   animate: (i: number) => ({
    opacity: [0.6, 1],
    scale: [0.95, 1.04, 1],
    y: [3, -2, 0],
    transition: {
     duration: 0.9 * duration,
     ease: "easeInOut",
     delay: i * 0.08,
    },
   }),
  };

  return (
   <motion.div
    className={cn("inline-flex items-center justify-center", className)}
    onMouseEnter={handleEnter}
    onMouseLeave={handleLeave}
    {...props}
   >
    <motion.svg
     xmlns="http://www.w3.org/2000/svg"
     width={size}
     height={size}
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     strokeLinecap="round"
     strokeLinejoin="round"
     animate={controls}
     initial="normal"
     variants={iconVariants}
    >
     <motion.rect
      width="7"
      height="9"
      x="3"
      y="3"
      rx="1"
      variants={tileVariants}
      custom={0}
     />
     <motion.rect
      width="7"
      height="5"
      x="14"
      y="3"
      rx="1"
      variants={tileVariants}
      custom={1}
     />
     <motion.rect
      width="7"
      height="9"
      x="14"
      y="12"
      rx="1"
      variants={tileVariants}
      custom={2}
     />
     <motion.rect
      width="7"
      height="5"
      x="3"
      y="16"
      rx="1"
      variants={tileVariants}
      custom={3}
     />
    </motion.svg>
   </motion.div>
  );
 }
);

DashboardIcon.displayName = "DashboardIcon";

// --- Other Icons (Maintaining existing implementations) ---

// ChartLine (Insights)
const chartAnimations = {
  normal: {
    path2: { opacity: 1, pathLength: 1, pathOffset: 0 },
  },
  animate: {
    path2: {
      opacity: [0, 1],
      pathLength: [0, 1],
      pathOffset: [1, 0],
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
        opacity: { duration: 0.01 },
      },
    },
  },
};

const userAnimations = {
  normal: {
    path: { y: 0 },
    circle: { y: 0 },
  },
  animate: {
    path: {
      y: [0, 4, -2, 0],
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
    circle: {
      y: [0, 1, -2, 0],
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  },
};

const calendarVariants: Variants = {
  normal: { 
    rotate: 0, 
    scale: 1,
    y: 0
  },
  animate: { 
    rotate: [0, -10, 10, -5, 5, 0],
    scale: [1, 1.1, 1],
    transition: { 
      duration: 0.6, 
      ease: "easeInOut",
      times: [0, 0.2, 0.4, 0.6, 0.8, 1]
    }
  }
};

interface IconProps {
  isActive?: boolean;
  className?: string;
}

export const AnimatedDashboard = DashboardIcon; // Export as AnimatedDashboard for compatibility

export const AnimatedInsights: React.FC<IconProps> = ({ isActive, className }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial="normal"
      animate={isActive ? "animate" : "normal"}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <motion.path
        d="m19 9-5 5-4-4-3 3"
        variants={{ normal: chartAnimations.normal.path2, animate: chartAnimations.animate.path2 }}
      />
    </motion.svg>
  );
};

export const AnimatedProfile: React.FC<IconProps> = ({ isActive, className }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial="normal"
      animate={isActive ? "animate" : "normal"}
    >
      <motion.path
        d="M20 21a8 8 0 0 0-16 0"
        variants={{ normal: userAnimations.normal.path, animate: userAnimations.animate.path }}
      />
      <motion.circle
        cx={12} cy={8} r={5}
        variants={{ normal: userAnimations.normal.circle, animate: userAnimations.animate.circle }}
      />
    </motion.svg>
  );
};

export const CustomAnimatedCalendar: React.FC<IconProps> = ({ isActive, className }) => {
    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        initial="normal"
        animate={isActive ? "animate" : "normal"}
        variants={calendarVariants}
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        
        <motion.circle 
          cx="12" cy="16" r="2" fill="currentColor" 
          animate={isActive ? { scale: [1, 1.5, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        />
      </motion.svg>
    );
  };

const heartVariants: Variants = {
  normal: { 
    scale: 1, 
    fill: "none", 
    stroke: "currentColor" 
  },
  animate: { 
    scale: [1, 1.2, 1],
    fill: ["rgba(236, 72, 153, 0)", "rgba(236, 72, 153, 1)", "rgba(236, 72, 153, 0)"],
    stroke: ["currentColor", "rgb(236, 72, 153)", "currentColor"],
    transition: { 
      duration: 0.8, 
      ease: "easeInOut",
      repeat: 0
    }
  }
};

export const AnimatedHeart: React.FC<IconProps> = ({ isActive, className }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial="normal"
      animate={isActive ? "animate" : "normal"}
      variants={heartVariants}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </motion.svg>
  );
};
