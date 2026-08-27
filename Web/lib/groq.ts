import Groq from 'groq-sdk';

// Initialize the Groq client with your API key.
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API,
  dangerouslyAllowBrowser: true, // required for client-side usage
});

// FINAL SAFE LIST: These models are 100% active, chat-capable, and require no terms.
// Since Groq deprecated llama-3.3-70b-versatile, we explicitly use the current stable models.
const SAFE_CHAT_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
];

/**
 * Fetch models dynamically, but ONLY return safe, no-terms-required chat models.
 * We filter out any "safety" models (like prompt-guard) or "terms-required" models.
 */
export async function fetchGroqModels(): Promise<string[]> {
  try {
    const response = await groq.models.list();
    
    // STRICT FILTER: Only keep models that are explicitly in our safe list.
    // This prevents picking up "meta-llama/llama-prompt-guard-2-22m" or "canopylabs/orpheus-v1-english".
    const safeModels = response.data
      .map((model) => model.id)
      .filter((modelId) => SAFE_CHAT_MODELS.includes(modelId));

    // If filtering returns nothing (e.g., Groq changes something), fall back to the hardcoded list.
    return safeModels.length > 0 ? safeModels : SAFE_CHAT_MODELS;
  } catch (error) {
    console.error('Failed to fetch Groq models, using hardcoded list:', error);
    return SAFE_CHAT_MODELS;
  }
}

/**
 * Send a chat completion request.
 * Automatically catches "terms required" or "model not found" errors and retries with a safe model.
 */
export async function sendGroqMessage(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string,
  signal?: AbortSignal
): Promise<string> {
  const cleanMessages = messages
    .filter((m) => m.content && m.content.trim().length > 0)
    .map(({ role, content }) => ({ role, content }));

  if (cleanMessages.length === 0) {
    throw new Error('Cannot send empty messages');
  }

  try {
    const chatCompletion = await groq.chat.completions.create(
      {
        messages: cleanMessages,
        model,
        max_tokens: 512,
      },
      { signal }
    );

    const reply = chatCompletion.choices[0]?.message?.content;
    if (!reply) throw new Error('No reply from Groq');
    return reply;

  } catch (error: any) {
    // AUTOMATIC FALLBACK: If Groq rejects the model, switch to the first stable one.
    if (error?.status === 400 || error?.status === 404) {
      const fallbackModel = SAFE_CHAT_MODELS[0]; // openai/gpt-oss-120b
      console.warn(`Model ${model} failed, switching to fallback: ${fallbackModel}`);

      const fallbackCompletion = await groq.chat.completions.create(
        {
          messages: cleanMessages,
          model: fallbackModel,
          max_tokens: 512,
        },
        { signal }
      );

      const reply = fallbackCompletion.choices[0]?.message?.content;
      if (!reply) throw new Error('No reply from Groq');
      return reply;
    }

    throw error;
  }
}