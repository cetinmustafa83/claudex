import { use } from 'react';
import { ChatSessionContext } from '@/contexts/ChatSessionContextDefinition';

export function useChatSessionContext() {
  const context = use(ChatSessionContext);
  if (!context) {
    throw new Error('useChatSessionContext must be used within a ChatSessionProvider');
  }
  return context;
}
