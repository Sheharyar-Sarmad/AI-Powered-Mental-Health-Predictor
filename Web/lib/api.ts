import axios from 'axios';

// Backend prediction API (deployed on Render)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Prediction endpoint
export const predictStudent = async (data: any) => {
  const response = await api.post('/predict', data);
  return response.data;
};

// Health check (optional)
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Groq direct calls (frontend) 
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Fetch all available models from Groq
export const fetchGroqModels = async () => {
  if (!GROQ_API_KEY) {
    throw new Error('NEXT_PUBLIC_GROQ_API_KEY is not set');
  }
  const response = await fetch(`${GROQ_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }

  const data = await response.json();
  return data.data.map((model: any) => model.id);
};

// Send a chat completion with a chosen model (dynamic)
export const sendGroqMessage = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string,
  signal?: AbortSignal
) => {
  if (!GROQ_API_KEY) {
    throw new Error('NEXT_PUBLIC_GROQ_API_KEY is not set');
  }

  // THE CRITICAL FIX: Remove empty messages AND strip out the 'timestamp' property
  // Groq ONLY supports { role, content }. It does NOT support 'timestamp'.
  const cleanMessages = messages
    .filter((m) => m.content && m.content.trim().length > 0)
    .map(({ role, content }) => ({ role, content })); 

  if (cleanMessages.length === 0) throw new Error('Cannot send empty messages');

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: cleanMessages,
      max_tokens: 512,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || 'Groq API error');
  }

  const data = await response.json();
  const reply = data.choices[0]?.message?.content;
  if (!reply) throw new Error('No reply from Groq');
  return reply;
};