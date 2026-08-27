import type { Metadata } from 'next';
import MainWrapper from '@/components/MainWrapper';

export const metadata: Metadata = {
  title: 'Mental Health Predictor',
  description: 'Predict mental health score using AI and chat with Groq',
};

export default function Home() {
  return <MainWrapper />;
}