import { use } from 'react';
import { InputContext } from '@/components/chat/message-input/InputContext';

export function useInputContext() {
  const context = use(InputContext);
  if (!context) {
    throw new Error('useInputContext must be used within an InputProvider');
  }
  return context;
}
