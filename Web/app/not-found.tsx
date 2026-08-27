"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import StarField from "@/components/StarField";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04030e] text-slate-100">
      {/* Ambient backdrop layers */}
      <StarField />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.15),transparent)]" />
      <div className="pointer-events-none fixed -left-40 top-1/3 z-0 h-[32rem] w-[32rem] rounded-full bg-emerald-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed -right-40 bottom-0 z-0 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex max-w-2xl flex-col items-center"
        >
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Mental Health Predictor Logo"
              width={120}
              height={120}
              priority
              className="drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            />
          </div>

          {/* 404 Heading */}
          <h1 className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-8xl font-extrabold tracking-tight text-transparent md:text-9xl">
            404
          </h1>

          <h2 className="mt-4 text-2xl font-bold text-emerald-300 md:text-3xl">
            Page Not Found
          </h2>

          {/* App Description */}
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400 md:text-base">
            Oops! The page you are looking for doesn&apos;t exist. But don&apos;t worry —
            your mental health journey is just one click away. 
          </p>
          <p className="mt-2 max-w-lg text-sm text-slate-500 md:text-base">
            <span className="font-medium text-emerald-400">Mental Health Predictor:</span>{" "}
            Get AI-powered, data-driven insights to keep your mind healthy and stress-free.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-[length:200%_100%] px-8 py-3.5 font-semibold text-white shadow-[0_8px_30px_-8px_rgba(16,185,129,0.65)] transition-[background-position] duration-500 hover:bg-[position:100%_0]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Go Back to Home
              </span>
            </Link>

            <Link
              href="/#predictor"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-8 py-3.5 font-semibold text-slate-200 backdrop-blur-sm transition-colors hover:border-emerald-400/60 hover:bg-white/[0.07] hover:text-emerald-300"
            >
              Try the Predictor
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Dark Scrollbar Styles */}
      <style>{`
        html, body, * {
          scrollbar-width: thin !important;
          scrollbar-color: #334155 #0f172a !important;
        }
      `}</style>
    </div>
  );
}