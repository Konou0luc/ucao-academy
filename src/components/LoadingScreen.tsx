"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

type LoadingScreenProps = {
  message?: string;
  withSound?: boolean;
  className?: string;
};

function playChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Autoplay or AudioContext not allowed
  }
}

export default function LoadingScreen({ message = "Chargement...", withSound = true, className = "" }: LoadingScreenProps) {
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (withSound && !soundPlayed.current) {
      soundPlayed.current = true;
      const t = setTimeout(playChime, 100);
      return () => clearTimeout(t);
    }
  }, [withSound]);

  return (
    <div
      className={`flex min-h-[min(100vh,400px)] flex-col items-center justify-center gap-6 bg-gray-50 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative w-[100px] h-[100px]">
        <div className="loading-screen-ring absolute inset-0" aria-hidden />
        <div className="loading-screen-logo absolute inset-0 flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="UCAO-UUT"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}
