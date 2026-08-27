import Groq from 'groq-sdk';

// Initialize the Groq client with your API key.
// The key is exposed on the frontend (prefixed with NEXT_PUBLIC_).
// For production, consider proxying through a server endpoint.
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API,
  dangerouslyAllowBrowser: true, // required for client‑side usage
});

/**
 * Fetch the list of all available models from Groq.
 * Returns an array of model IDs (e.g., ['llama3-8b-8192', ...]).
 */
export async function fetchGroqModels(): Promise<string[]> {
  try {
    const response = await groq.models.list();
    return response.data.map((model) => model.id);
  } catch (error) {
    console.error('Failed to fetch Groq models:', error);
    // Fallback list in case the API call fails
    return ['llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  }
}

/**
 * Send a chat completion request using a specified model.
 * @param messages - Array of message objects with role and content.
 * @param model - The model ID to use (e.g., 'llama3-8b-8192').
 * @returns The assistant's reply as a string.
 */
export async function sendGroqMessage(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string
): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages,
    model,
    temperature: 0.7,
    max_tokens: 512,
  });

  const reply = chatCompletion.choices[0]?.message?.content;
  if (!reply) throw new Error('No reply from Groq');
  return reply;
}