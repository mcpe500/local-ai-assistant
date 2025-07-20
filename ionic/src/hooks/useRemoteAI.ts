import { useAppStore } from '../store/useAppStore';
import { AIResponse } from './useAI';

export const useRemoteAI = () => {
  const { settings } = useAppStore();

  const processText = async (text: string, action: string): Promise<AIResponse> => {
    try {
      if (!settings.remoteEndpoint) {
        return {
          success: false,
          error: 'Remote AI endpoint not configured. Please check your settings.'
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      // Ollama-compatible payload
      const payload = {
        model: settings.model || 'llama2',
        prompt: text,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000
        }
      };

      const response = await fetch(settings.remoteEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different API response formats
      let result = '';
      if (data.response) {
        result = data.response; // Ollama format
      } else if (data.choices && data.choices[0]?.message?.content) {
        result = data.choices[0].message.content; // OpenAI format
      } else if (data.text) {
        result = data.text; // Generic format
      } else {
        throw new Error('Unexpected response format from AI service');
      }

      return {
        success: true,
        result: result.trim()
      };

    } catch (error) {
      console.error('Remote AI request failed:', error);
      return {
        success: false,
        error: `Remote AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  return {
    processText
  };
};