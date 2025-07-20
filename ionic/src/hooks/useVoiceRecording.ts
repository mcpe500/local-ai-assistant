import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

export interface VoiceRecordingResult {
  success: boolean;
  audioBlob?: Blob;
  error?: string;
}

export const useVoiceRecording = () => {
  const { setRecording } = useAppStore();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimize for speech recognition
        }
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // Good compression for speech
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setRecording(false);
        setRecordingTime(0);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecording(true);

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown recording error';
      setError(`Failed to start recording: ${errorMessage}`);
      setRecording(false);
      throw err;
    }
  }, [setRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        
        // Wait for the stop event to process
        return new Promise((resolve) => {
          const checkForBlob = () => {
            if (audioBlob) {
              resolve(audioBlob);
            } else {
              setTimeout(checkForBlob, 100);
            }
          };
          
          // Set a timeout to resolve with current audioBlob after stop event
          setTimeout(() => {
            checkForBlob();
          }, 500);
        });
      }
      
      return audioBlob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error stopping recording';
      setError(`Failed to stop recording: ${errorMessage}`);
      throw err;
    }
  }, [audioBlob]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError(null);
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    clearRecording,
    cleanup,
    audioBlob,
    recordingTime,
    error
  };
};