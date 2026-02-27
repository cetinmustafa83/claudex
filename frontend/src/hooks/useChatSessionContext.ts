import { use } from 'react';
import {
  ChatSessionContext,
  ChatSessionStateContext,
  ChatSessionActionsContext,
} from '@/contexts/ChatSessionContextDefinition';

export function useChatSessionContext() {
  const context = use(ChatSessionContext);
  if (!context) {
    throw new Error('useChatSessionContext must be used within a ChatSessionProvider');
  }
  return context;
}

export function useChatSessionState() {
  const context = use(ChatSessionStateContext);
  if (!context) {
    throw new Error('useChatSessionState must be used within a ChatSessionProvider');
  }
  return context;
}

export function useChatSessionActions() {
  const context = use(ChatSessionActionsContext);
  if (!context) {
    throw new Error('useChatSessionActions must be used within a ChatSessionProvider');
  }
  return context;
}
