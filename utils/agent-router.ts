import type { AgentRouterConfig } from '../types';

export interface GenerateCompletionParams {
  config: AgentRouterConfig;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export async function generateChatReply({
  config,
  systemPrompt,
  messages,
}: GenerateCompletionParams): Promise<string> {
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('Agent Router API Key is missing. Please configure it in the extension Side Panel settings.');
  }

  // Ensure baseUrl doesn't have trailing slash
  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
  const endpoint = cleanBaseUrl.endsWith('/chat/completions')
    ? cleanBaseUrl
    : `${cleanBaseUrl}/chat/completions`;

  const payload = {
    model: config.model || 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 250,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'HTTP-Referer': 'https://github.com/shahmdmahi15/social-chatbot',
      'X-Title': 'Social Chatbot Chrome Extension',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`Agent Router API error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice || !choice.message?.content) {
    throw new Error('Empty or invalid completion returned by Agent Router.');
  }

  let replyText = choice.message.content.trim();
  // Strip any wrapping quotes or prefixes if LLM output them
  replyText = replyText.replace(/^["']|["']$/g, '');

  return replyText;
}

export async function testConnection(config: AgentRouterConfig): Promise<{ success: boolean; message: string }> {
  try {
    const reply = await generateChatReply({
      config,
      systemPrompt: 'You are a connection test. Reply with: "OK"',
      messages: [{ role: 'user', content: 'ping' }],
    });
    return { success: true, message: `Connected successfully! Response: ${reply.slice(0, 50)}` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
}
