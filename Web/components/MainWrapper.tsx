'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import {
  UserCircleIcon,
  HeartIcon,
  ClockIcon,
  MoonIcon,
  BoltIcon,
  SparklesIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { predictStudent } from '@/lib/api';
import GroqChatWrapper from './GroqChatWrapper';
import StarField from './StarField';
import MessageContent from './MessageContent';

// ---------- Types ----------
// Keep this in sync with `top_countries` in the FastAPI backend (main.py).
// The backend normalizes anything outside this list to "Other", so the
// dropdown below intentionally mirrors it 1:1.
const COUNTRIES = ['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France', 'Other'] as const;

type FormData = {
  age: number;
  gender: 'Male' | 'Female';
  country: (typeof COUNTRIES)[number];
  academic_level: 'Undergraduate' | 'Graduate' | 'High School';
  most_used_platform:
    | 'Facebook'
    | 'LinkedIn'
    | 'Instagram'
    | 'Snapchat'
    | 'Twitter'
    | 'YouTube'
    | 'TikTok'
    | 'LINE'
    | 'KakaoTalk'
    | 'VKontakte'
    | 'WhatsApp'
    | 'WeChat';
  purpose_of_use: 'Networking' | 'Education' | 'Entertainment' | 'News';
  avg_daily_usage_hours: number;
  daily_unlocks: number;
  study_hours: number;
  physical_activity_hours: number;
  sleep_hours_per_night: number;
  stress_level: 'Low' | 'Medium' | 'High' | 'Very High';
};

type Result = {
  predicted_mental_health_score: number;
  status: string;
  recommendation: string;
};

// ---------- Shared field styling ----------
const fieldClass =
  'mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-slate-100 placeholder-slate-500 shadow-inner shadow-black/20 outline-none backdrop-blur-sm transition-all duration-200 focus:border-violet-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-500/25';
const labelClass = 'block text-[13px] font-medium tracking-wide text-slate-400';

export default function MainWrapper() {
  // ---------- State ----------
  const [formData, setFormData] = useState<FormData>({
    age: 22,
    gender: 'Male',
    country: 'India',
    academic_level: 'Undergraduate',
    most_used_platform: 'Instagram',
    purpose_of_use: 'Entertainment',
    avg_daily_usage_hours: 4,
    daily_unlocks: 50,
    study_hours: 3,
    physical_activity_hours: 1.5,
    sleep_hours_per_night: 7,
    stress_level: 'Medium',
  });

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  // Refs for GSAP
  const gaugeRef = useRef<SVGCircleElement>(null);
  const gaugeGlowRef = useRef<SVGCircleElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ---------- Predict ----------
  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await predictStudent(formData);
      setResult(res);
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Prediction failed. See console.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- GSAP gauge animation ----------
  useEffect(() => {
    if (result && gaugeRef.current) {
      const score = result.predicted_mental_health_score / 10;
      const circumference = 2 * Math.PI * 45;
      const offset = circumference * (1 - score);
      gsap.fromTo(
        [gaugeRef.current, gaugeGlowRef.current],
        { strokeDashoffset: circumference },
        { strokeDashoffset: offset, duration: 1.4, ease: 'power3.out' }
      );
    }
  }, [result]);

  // Entrance animation for result card
  useEffect(() => {
    if (result && resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, [result]);

  // ---------- Score presentation helpers ----------
  const scoreColor = (score: number) => {
    if (score >= 7) return { ring: '#34d399', glow: 'rgba(52,211,153,0.55)', text: 'text-emerald-400' };
    if (score >= 4) return { ring: '#fbbf24', glow: 'rgba(251,191,36,0.55)', text: 'text-amber-400' };
    return { ring: '#fb7185', glow: 'rgba(251,113,133,0.55)', text: 'text-rose-400' };
  };

  // ---------- Key Factors ----------
  const keyFactors = [
    {
      label: 'Stress Level',
      value: formData.stress_level,
      icon: BoltIcon,
      color:
        formData.stress_level === 'Low'
          ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
          : formData.stress_level === 'Medium'
          ? 'text-amber-400 bg-amber-400/10 ring-amber-400/20'
          : 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
    },
    {
      label: 'Sleep Hours',
      value: `${formData.sleep_hours_per_night}h`,
      icon: MoonIcon,
      color:
        formData.sleep_hours_per_night >= 7
          ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
          : 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
    },
    {
      label: 'Screen Time',
      value: `${formData.avg_daily_usage_hours}h/day`,
      icon: ClockIcon,
      color:
        formData.avg_daily_usage_hours <= 6
          ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
          : 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
    },
    {
      label: 'Physical Activity',
      value: `${formData.physical_activity_hours}h`,
      icon: HeartIcon,
      color:
        formData.physical_activity_hours >= 1
          ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
          : 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
    },
  ];

  const sc = result ? scoreColor(result.predicted_mental_health_score) : null;

  // ---------- Render ----------
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04030e] text-slate-100">
      {/* Ambient backdrop layers */}
      <StarField />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(124,58,237,0.25),transparent)]" />
      <div className="pointer-events-none fixed -left-40 top-1/3 z-0 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed -right-40 bottom-0 z-0 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 p-6 md:p-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-violet-300 backdrop-blur-sm">
              <SparklesIcon className="h-3.5 w-3.5" />
              AI Wellbeing Insight
            </div>
            <h1 className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Mental Health Predictor
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 md:text-base">
              Tell us about your day-to-day habits and get a personalized, data-driven read on your wellbeing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: Form */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
                  <UserCircleIcon className="h-5 w-5" />
                </span>
                Your Details
              </h2>

              <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1.5">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className={fieldClass}
                  >
                    <option className="bg-[#0b0a1a]">Male</option>
                    <option className="bg-[#0b0a1a]">Female</option>
                  </select>
                </div>

                <div>
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <GlobeAltIcon className="h-3.5 w-3.5" />
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value as any })}
                    className={fieldClass}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} className="bg-[#0b0a1a]">
                        {c}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Don&apos;t see your country? Choose &ldquo;Other&rdquo; — the model still works.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Academic Level</label>
                  <select
                    value={formData.academic_level}
                    onChange={(e) => setFormData({ ...formData, academic_level: e.target.value as any })}
                    className={fieldClass}
                  >
                    <option className="bg-[#0b0a1a]">Undergraduate</option>
                    <option className="bg-[#0b0a1a]">Graduate</option>
                    <option className="bg-[#0b0a1a]">High School</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Most Used Platform</label>
                  <select
                    value={formData.most_used_platform}
                    onChange={(e) => setFormData({ ...formData, most_used_platform: e.target.value as any })}
                    className={fieldClass}
                  >
                    {[
                      'Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
                      'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat',
                    ].map((p) => (
                      <option key={p} className="bg-[#0b0a1a]">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Purpose of Use</label>
                  <select
                    value={formData.purpose_of_use}
                    onChange={(e) => setFormData({ ...formData, purpose_of_use: e.target.value as any })}
                    className={fieldClass}
                  >
                    <option className="bg-[#0b0a1a]">Networking</option>
                    <option className="bg-[#0b0a1a]">Education</option>
                    <option className="bg-[#0b0a1a]">Entertainment</option>
                    <option className="bg-[#0b0a1a]">News</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Avg Daily Usage (hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.avg_daily_usage_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, avg_daily_usage_hours: parseFloat(e.target.value) || 0 })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Daily Unlocks</label>
                  <input
                    type="number"
                    value={formData.daily_unlocks}
                    onChange={(e) => setFormData({ ...formData, daily_unlocks: parseInt(e.target.value) || 0 })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Study Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.study_hours}
                    onChange={(e) => setFormData({ ...formData, study_hours: parseFloat(e.target.value) || 0 })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Physical Activity (hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.physical_activity_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, physical_activity_hours: parseFloat(e.target.value) || 0 })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Sleep Hours per Night</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.sleep_hours_per_night}
                    onChange={(e) =>
                      setFormData({ ...formData, sleep_hours_per_night: parseFloat(e.target.value) || 0 })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Stress Level</label>
                  <select
                    value={formData.stress_level}
                    onChange={(e) => setFormData({ ...formData, stress_level: e.target.value as any })}
                    className={fieldClass}
                  >
                    <option className="bg-[#0b0a1a]">Low</option>
                    <option className="bg-[#0b0a1a]">Medium</option>
                    <option className="bg-[#0b0a1a]">High</option>
                    <option className="bg-[#0b0a1a]">Very High</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handlePredict}
                  disabled={loading}
                  className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_100%] py-3 font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.65)] transition-[background-position] duration-500 hover:bg-[position:100%_0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Predicting…
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        Predict Mental Health
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>

            {/* Right: Results + Chat */}
            <div className="space-y-6">
              {result && sc && (
                <motion.div
                  ref={resultRef}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                >
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20">
                      <HeartIcon className="h-5 w-5" />
                    </span>
                    Results
                  </h2>

                  {/* Gauge */}
                  <div className="mb-5 flex justify-center">
                    <div className="relative h-36 w-36">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                        <circle
                          ref={gaugeGlowRef}
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={sc.ring}
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray="282.7"
                          strokeDashoffset="282.7"
                          opacity="0.25"
                          style={{ filter: `blur(6px)` }}
                        />
                        <circle
                          ref={gaugeRef}
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={sc.ring}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="282.7"
                          strokeDashoffset="282.7"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${sc.text}`}>
                          {result.predicted_mental_health_score}
                        </span>
                        <span className="text-[11px] uppercase tracking-wider text-slate-500">out of 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <p className={`text-lg font-medium ${sc.text}`}>{result.status}</p>
                    <div className="text-left text-sm text-slate-400">
                      <MessageContent text={result.recommendation} />
                    </div>
                  </div>

                  {/* Key Factors */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {keyFactors.map((factor) => (
                      <div
                        key={factor.label}
                        className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-3 ring-1 ring-inset ring-white/5"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${factor.color}`}>
                          <factor.icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] text-slate-500">{factor.label}</p>
                          <p className="truncate text-sm font-medium text-slate-200">{factor.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Chat Wrapper – passes the result message if available */}
              <GroqChatWrapper
                initialMessage={
                  result
                    ? `Your mental health score is ${result.predicted_mental_health_score}. ${result.status}. ${result.recommendation}`
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}