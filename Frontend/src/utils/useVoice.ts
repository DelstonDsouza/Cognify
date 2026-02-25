/**
 * src/utils/useVoice.ts
 * Reusable hook that manages voice recording state.
 * Used by Dashboard, HealthVitals, and any future voice-enabled page.
 */

import { useState, useCallback, useRef } from 'react';
import { startListening, speak } from './sevaApi';

export type VoiceState = 'idle' | 'speaking' | 'listening' | 'processing' | 'error';

interface UseVoiceReturn {
  state:       VoiceState;
  transcript:  string;
  error:       string | null;
  isListening: boolean;
  /** Start listening and return the transcript string (or null on error) */
  listen:      () => Promise<string | null>;
  /** Speak text aloud */
  say:         (text: string) => void;
  /** Reset to idle */
  reset:       () => void;
}

export function useVoice(): UseVoiceReturn {
  const [state,      setState]      = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error,      setError]      = useState<string | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setError(null);
  }, []);

  const say = useCallback((text: string) => {
    setState('speaking');
    speak(text);
    // Reset to idle after estimated speech duration
    const ms = Math.max(1500, text.length * 60);
    setTimeout(() => setState('idle'), ms);
  }, []);

  const listen = useCallback(async (): Promise<string | null> => {
    setError(null);
    setTranscript('');
    setState('listening');

    try {
      const result = await startListening();
      setTranscript(result);
      setState('processing');
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Could not hear you. Please try again.';
      setError(msg);
      setState('error');
      return null;
    }
  }, []);

  return {
    state,
    transcript,
    error,
    isListening: state === 'listening',
    listen,
    say,
    reset,
  };
}