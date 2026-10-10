/**
 * LLM provider abstraction. Swap between a deterministic mock (default, no
 * keys needed), OpenAI, or Azure OpenAI without changing the agent.
 */

import type { ChatMessage } from '@viraliza/core';

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider for a JSON object instead of prose. */
  json?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AiProvider {
  readonly name: string;
  complete(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatCompletionResult>;
}

export interface AiConfig {
  provider: 'mock' | 'openai' | 'azure-openai';
  model: string;
  openaiApiKey?: string;
  azure?: { endpoint?: string; apiKey?: string; deployment?: string };
}
