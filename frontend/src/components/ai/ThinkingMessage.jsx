import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function ThinkingMessage({
  steps = ['Analyzing your question', 'Understanding the topic', 'Preparing an explanation'],
  interval = 2400,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!steps || steps.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % steps.length);
    }, interval);

    return () => clearInterval(timer);
  }, [steps, interval]);

  const currentMessage = steps[index] || steps[0] || 'Thinking…';

  return (
    <div
      className={`relative inline-flex items-center text-xs font-normal text-muted-foreground ${className}`}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentMessage}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="truncate tracking-wide"
        >
          {currentMessage}...
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
