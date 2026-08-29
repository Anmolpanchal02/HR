export interface LLMUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface LLMResponse {
  content: string;
  usage: LLMUsage;
}

export interface LLMGenerateInput {
  systemPrompt: string;
  userPrompt: string;
}

export interface LLMProvider {
  readonly providerName: string;
  readonly modelName: string;
  generateAnswer(input: LLMGenerateInput): Promise<LLMResponse>;
}
