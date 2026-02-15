import { type ReactNode, useMemo } from 'react';
import {
  ChatSessionContext,
  type ChatSessionState,
  type ChatSessionActions,
} from './ChatSessionContextDefinition';

interface ChatSessionProviderProps {
  state: ChatSessionState;
  actions: ChatSessionActions;
  children: ReactNode;
}

export function ChatSessionProvider({ state, actions, children }: ChatSessionProviderProps) {
  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>;
}
