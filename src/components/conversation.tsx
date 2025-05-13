'use client';

import { useConversation } from '@11labs/react';
import { useEffect } from 'react';

export function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  useEffect(() => {
    let started = false;
    async function startConversation() {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Start the conversation with your agent
        await conversation.startSession({
          agentId: 'MC7ZFoe2uncxPZGSLfZo',
        });
        started = true;
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    }
    if (!started && conversation.status === 'disconnected') {
      startConversation();
    }
    // Optionally, end session on unmount
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.status]);

  return;
}
