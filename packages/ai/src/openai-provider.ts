import type { AiProvider, ChatCompletionOptions, ChatCompletionResult } from './provider';
import { MockAiProvider } from './mock-provider';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  constructor(private readonly apiKey: string, private readonly model = 'gpt-4o-mini') {}

  async complete(
    messages: { role: string; content: string }[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 600,
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    return {
      content: data.choices[0]?.message.content ?? '',
      usage: data.usage
        ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
        : undefined,
    };
  }
}

export class AzureOpenAiProvider implements AiProvider {
  readonly name = 'azure-openai';
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly deployment: string,
  ) {}

  async complete(
    messages: { role: string; content: string }[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const base = this.endpoint.replace(/\/$/, '');
    const url = `${base}/openai/deployments/${this.deployment}/chat/completions?api-version=2024-06-01`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 600,
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Azure OpenAI error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    return {
      content: data.choices[0]?.message.content ?? '',
      usage: data.usage
        ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
        : undefined,
    };
  }
}

export function createProvider(config: {
  provider: 'mock' | 'openai' | 'azure-openai';
  model: string;
  openaiApiKey?: string;
  azure?: { endpoint?: string; apiKey?: string; deployment?: string };
}): AiProvider {
  if (config.provider === 'openai' && config.openaiApiKey) {
    return new OpenAiProvider(config.openaiApiKey, config.model);
  }
  if (config.provider === 'azure-openai' && config.azure?.endpoint && config.azure.apiKey && config.azure.deployment) {
    return new AzureOpenAiProvider(config.azure.endpoint, config.azure.apiKey, config.azure.deployment);
  }
  // Fall back to the deterministic mock so the app always works.
  return new MockAiProvider();
}
