"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/landing/icons";

const STORAGE_KEY = "intro-seen";
const VIDEO_SRC =
  "https://res.cloudinary.com/dkqbzwicr/video/upload/v1788096277/Introvideo_ou5m4c.webm";

export function IntroVideo() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const enterRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (!seen) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    enterRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setLeaving(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable — intro just shows again next load */
    }
    window.setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, 400);
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next) void video.play().catch(() => {});
  }

  function syncBg() {
    const front = videoRef.current;
    const bg = bgVideoRef.current;
    if (!front || !bg) return;
    if (Math.abs(bg.currentTime - front.currentTime) > 0.3) {
      bg.currentTime = front.currentTime;
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction video"
      className={`fixed inset-0 z-[60] bg-black transition-opacity duration-[400ms] ease-out ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Blurred, scaled backdrop copy — fills the edges with a smoky wash */}
      <video
        ref={bgVideoRef}
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.55] saturate-150"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Sharp video, edges feathered into the backdrop so the corner watermark dissolves */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover [mask-image:radial-gradient(125%_125%_at_50%_45%,#000_52%,transparent_90%)] [-webkit-mask-image:radial-gradient(125%_125%_at_50%_45%,#000_52%,transparent_90%)]"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onPlay={() => void bgVideoRef.current?.play().catch(() => {})}
        onTimeUpdate={syncBg}
      />

      {/* Extra local blur over the bottom-right watermark */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-64 [backdrop-filter:blur(16px)] [-webkit-backdrop-filter:blur(16px)] [mask-image:radial-gradient(circle_at_bottom_right,#000_25%,transparent_72%)] [-webkit-mask-image:radial-gradient(circle_at_bottom_right,#000_25%,transparent_72%)]" />

      {/* Scrim for control legibility over any frame */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="btn-glass absolute right-4 top-4 rounded-full p-3 transition hover:scale-105 sm:right-6 sm:top-6"
      >
        {muted ? (
          <VolumeXIcon className="size-5" />
        ) : (
          <Volume2Icon className="size-5" />
        )}
      </button>

      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 sm:bottom-10">
        <button
          ref={enterRef}
          type="button"
          onClick={dismiss}
          className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold tracking-wide"
        >
          Enter
          <Icon.arrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function VolumeXIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function Volume2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
