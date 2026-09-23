import React from 'react';
import AIThinkingIndicator from './ai/AIThinkingIndicator';

export default function TypingIndicator({ category = 'General', compact = false, streaming = false }) {
  return (
    <AIThinkingIndicator
      isThinking={true}
      category={category}
      compact={compact}
      streaming={streaming}
    />
  );
}
