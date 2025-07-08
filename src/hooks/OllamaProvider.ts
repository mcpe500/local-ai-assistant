// src/hooks/OllamaProvider.ts
import { BaseLLM, BaseEmbeddings } from 'react-native-rag';

const OLLAMA_API_BASE_URL = 'http://localhost:11434/api';

interface OllamaGenerateParams {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  template?: string;
  context?: number[];
  options?: Record<string, unknown>;
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaEmbeddingsParams {
  model: string;
  prompt: string;
  options?: Record<string, unknown>;
}

interface OllamaEmbeddingsResponse {
  embedding: number[];
}

export class OllamaLLM extends BaseLLM {
  private model: string;
  private system?: string;

  constructor(model: string = 'qwen2', system?: string) {
    super();
    this.model = model;
    this.system = system;
  }

  async generate(
    prompt: string,
    callback?: (chunk: string) => void
  ): Promise<string> {
    try {
      const params: OllamaGenerateParams = {
        model: this.model,
        prompt: prompt,
        stream: false, // react-native-rag expects the full response
      };
      if (this.system) {
        params.system = this.system;
      }

      const response = await fetch(`${OLLAMA_API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Ollama API request failed: ${response.status} ${response.statusText}`,
          errorBody
        );
        throw new Error(
          `Ollama API request failed: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      const data = (await response.json()) as OllamaGenerateResponse;

      if (data.response) {
        // For non-streaming, react-native-rag expects the callback to be called once with the full response.
        if (callback) {
          callback(data.response);
        }
        return data.response;
      } else {
        throw new Error('No response field in Ollama API output');
      }
    } catch (error) {
      console.error('Error generating text with Ollama:', error);
      throw error;
    }
  }
}

export class OllamaEmbeddings extends BaseEmbeddings {
  private model: string;

  constructor(model: string = 'nomic-embed-text') {
    // nomic-embed-text is a good default, mxbai-embed-large is another option
    super();
    this.model = model;
  }

  async generate(text: string): Promise<number[]> {
    try {
      const params: OllamaEmbeddingsParams = {
        model: this.model,
        prompt: text,
      };

      const response = await fetch(`${OLLAMA_API_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Ollama Embeddings API request failed: ${response.status} ${response.statusText}`,
          errorBody
        );
        throw new Error(
          `Ollama Embeddings API request failed: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      const data = (await response.json()) as OllamaEmbeddingsResponse;

      if (data.embedding) {
        return data.embedding;
      } else {
        throw new Error('No embedding field in Ollama API output');
      }
    } catch (error) {
      console.error('Error generating embeddings with Ollama:', error);
      throw error;
    }
  }
}
