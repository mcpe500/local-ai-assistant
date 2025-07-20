import { useAppStore, AIMode } from '../store/useAppStore';
import { useOnDeviceAI } from './useOnDeviceAI';
import { useRemoteAI } from './useRemoteAI';

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export const useAI = () => {
  const { settings, setProcessing } = useAppStore();
  const onDeviceAI = useOnDeviceAI();
  const remoteAI = useRemoteAI();

  const processText = async (text: string, action: string): Promise<AIResponse> => {
    setProcessing(true);
    
    try {
      const mode = settings.aiMode || AIMode.REMOTE;
      
      let response: AIResponse;
      
      if (mode === AIMode.ON_DEVICE) {
        response = await onDeviceAI.processText(text, action);
      } else {
        response = await remoteAI.processText(text, action);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: `AI processing failed: ${error}`
      };
    } finally {
      setProcessing(false);
    }
  };

  const summarizeMeeting = async (text: string): Promise<AIResponse> => {
    const prompt = `Please summarize the following meeting notes, highlighting key points and decisions:\n\n${text}`;
    return processText(prompt, 'summarize');
  };

  const extractActionItems = async (text: string): Promise<AIResponse> => {
    const prompt = `Extract action items and tasks from the following meeting notes:\n\n${text}`;
    return processText(prompt, 'extract_actions');
  };

  const analyzeNotes = async (text: string): Promise<AIResponse> => {
    const prompt = `Analyze the following notes and provide insights:\n\n${text}`;
    return processText(prompt, 'analyze');
  };

  return {
    processText,
    summarizeMeeting,
    extractActionItems,
    analyzeNotes
  };
};