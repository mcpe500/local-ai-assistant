import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  error?: string;
}

export const useTranscription = () => {
  const { settings, setTranscribing } = useAppStore();

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<TranscriptionResult> => {
    setTranscribing(true);
    
    try {
      if (settings.transcriptionMode === 'local') {
        return await transcribeLocally(audioBlob);
      } else {
        return await transcribeRemotely(audioBlob);
      }
    } catch (error) {
      return {
        success: false,
        error: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      setTranscribing(false);
    }
  }, [settings.transcriptionMode, setTranscribing]);

  const transcribeLocally = async (audioBlob: Blob): Promise<TranscriptionResult> => {
    try {
      // This is a placeholder for local transcription using WebAssembly
      // In production, you would integrate a quantized Whisper model
      
      // Convert blob to audio buffer for processing
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Mock transcription - in production, this would use a WASM-based Whisper model
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Simulate transcription based on audio duration
      const duration = audioBuffer.duration;
      const mockTranscriptions = [
        "This is a test transcription of the recorded audio.",
        "The meeting discussed project timelines and deliverables for the next quarter.",
        "We need to review the budget allocation and resource planning for the upcoming sprint.",
        "Action items include updating documentation and scheduling follow-up meetings.",
        "The team agreed on the technical approach and implementation strategy."
      ];
      
      const transcription = duration > 10 
        ? mockTranscriptions.join(' ') 
        : mockTranscriptions[0];

      return {
        success: true,
        transcription
      };

    } catch (error) {
      console.error('Local transcription failed:', error);
      return {
        success: false,
        error: `Local transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const transcribeRemotely = async (audioBlob: Blob): Promise<TranscriptionResult> => {
    try {
      if (!settings.transcriptionEndpoint) {
        return {
          success: false,
          error: 'Remote transcription endpoint not configured'
        };
      }

      // Convert audio blob to base64 or form data for API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1'); // Default model
      formData.append('language', 'en'); // Default to English

      const headers: Record<string, string> = {};
      
      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const response = await fetch(settings.transcriptionEndpoint, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different API response formats
      let transcription = '';
      if (data.text) {
        transcription = data.text; // OpenAI Whisper format
      } else if (data.transcription) {
        transcription = data.transcription; // Generic format
      } else if (data.results && data.results[0]?.alternatives?.[0]?.transcript) {
        transcription = data.results[0].alternatives[0].transcript; // Google Speech-to-Text format
      } else {
        throw new Error('Unexpected response format from transcription service');
      }

      return {
        success: true,
        transcription: transcription.trim()
      };

    } catch (error) {
      console.error('Remote transcription failed:', error);
      return {
        success: false,
        error: `Remote transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  return {
    transcribeAudio
  };
};