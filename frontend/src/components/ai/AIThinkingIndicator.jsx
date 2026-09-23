import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import ThoughtLine from './ThoughtLine';
import ThinkingMessage from './ThinkingMessage';
import { getThoughtSteps } from './thoughtConfig';
import { cn } from '@/lib/utils';

/**
 * AIThinkingIndicator - Polished AI Processing / Thinking state component.
 * Communicates: "Study Buddy is processing your question."
 * High-level UX status indicator, NOT private internal chain-of-thought.
 */
export default function AIThinkingIndicator({
  isThinking = true,
  category = 'General',
  message,
  streaming = false,
  compact = false,
  showTrace = true,
  showTimer = true,
  onSettle,
  className = '',
}) {
  const steps = getThoughtSteps(category);
  const activeLabel = message || (streaming ? 'Generating response…' : 'Thinking…');

  if (!isThinking && !streaming) return null;

  // Compact Mode (for inline cards, sidebars, or headers)
  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-md shadow-sm text-xs text-foreground select-none',
            className
          )}
          role="status"
          aria-live="polite"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <ThoughtLine
            label={activeLabel}
            doneLabel="Ready"
            working={isThinking}
            showTrack={false}
            showTimer={showTimer}
            fontSize={12}
            collapsible={false}
            onSettle={onSettle}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full Conversation Area Mode (Natural part of assistant flow)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, height: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('flex gap-4 w-full max-w-3xl my-2 select-none', className)}
        role="status"
        aria-live="polite"
      >
        {/* Assistant Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-card border border-border/80 shadow-sm text-foreground">
          <Bot size={18} className="text-primary animate-pulse" />
        </div>

        {/* Thought Line Card Container */}
        <div className="flex-1 max-w-[85%] rounded-2xl border border-border/70 bg-card/85 backdrop-blur-md p-4 shadow-sm space-y-3">
          {/* Top Status and Dynamic Label */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
            <ThoughtLine
              label={activeLabel}
              doneLabel="Ready"
              steps={showTrace ? steps : []}
              working={isThinking}
              showTimer={showTimer}
              collapsible={showTrace}
              collapseOnSettle
              fontSize={13}
              onSettle={onSettle}
            />
            {category && (
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
                {category}
              </span>
            )}
          </div>

          {/* Rotating Context-Aware UX Message */}
          <div className="pt-0.5">
            <ThinkingMessage steps={steps} interval={2500} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export { AIThinkingIndicator };
