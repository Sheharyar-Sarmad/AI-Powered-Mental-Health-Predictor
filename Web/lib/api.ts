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
  const response = await axios.get(`${GROQ_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  // Return the list of model IDs
  return response.data.data.map((model: any) => model.id);
};

// Send a chat completion with a chosen model (dynamic)
export const sendGroqMessage = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string // now required – no default
) => {
  if (!GROQ_API_KEY) {
    throw new Error('NEXT_PUBLIC_GROQ_API_KEY is not set');
  }

  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 512,
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const reply = response.data.choices[0]?.message?.content;
  if (!reply) throw new Error('No reply from Groq');
  return reply;
};