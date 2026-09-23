/**
 * Category-aware UI status indicators for AI Thinking state.
 * These messages indicate high-level UX processing state,
 * NOT internal model chain-of-thought or reasoning tokens.
 */

export const CATEGORY_THOUGHT_STEPS = {
  'Computer Science': [
    'Analyzing your programming question',
    'Reviewing syntax & algorithmic concepts',
    'Formulating structured explanation & code',
    'Polishing code examples',
  ],
  'Coding': [
    'Analyzing code structure & logic',
    'Checking patterns and best practices',
    'Drafting clean code solution',
  ],
  'Mathematics': [
    'Parsing problem formulation',
    'Working through mathematical steps',
    'Formulating clear step-by-step solution',
  ],
  'Science': [
    'Reviewing core scientific concepts',
    'Analyzing physical & empirical principles',
    'Structuring comprehensive explanation',
  ],
  'Interview Preparation': [
    'Analyzing interview question context',
    'Structuring an interview-ready answer',
    'Highlighting key discussion points',
  ],
  'Research': [
    'Scanning relevant research topics',
    'Synthesizing key insights & findings',
    'Drafting comprehensive research breakdown',
  ],
  'PDF Analysis': [
    'Examining document context',
    'Locating relevant passage excerpts',
    'Synthesizing response from sources',
  ],
  'Summary': [
    'Reading and extracting key ideas',
    'Condensing core information',
    'Formatting structured summary',
  ],
  'General': [
    'Analyzing your question',
    'Understanding the topic',
    'Preparing an explanation',
    'Organizing the response',
  ],
};

export const DEFAULT_CATEGORY = 'General';

/**
 * Get thought steps array for a given category name.
 * Safe fallback to General if category is unknown or undefined.
 */
export function getThoughtSteps(category) {
  if (!category) return CATEGORY_THOUGHT_STEPS[DEFAULT_CATEGORY];

  // Direct match
  if (CATEGORY_THOUGHT_STEPS[category]) {
    return CATEGORY_THOUGHT_STEPS[category];
  }

  // Case-insensitive / partial match
  const lower = category.toLowerCase();
  for (const [key, steps] of Object.entries(CATEGORY_THOUGHT_STEPS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return steps;
    }
  }

  return CATEGORY_THOUGHT_STEPS[DEFAULT_CATEGORY];
}
