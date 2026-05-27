"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioAsset } from "@/types/audio";

type AudioPlayerProps = {
  accentColor: string;
  asset: AudioAsset;
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
};

type PreviewLoadState = "loading" | "ready" | "error";

function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function AudioPlayer({
  asset,
  accentColor,
  isMinimized = false,
  onToggleMinimized,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset.duration);
  const [previewLoadState, setPreviewLoadState] =
    useState<PreviewLoadState>("loading");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(asset.duration);
    setPreviewLoadState("loading");
    setDetailsOpen(false);
  }, [asset]);

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio || previewLoadState !== "ready") {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setPreviewLoadState("error");
    }
  }

  function resetPlayback() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  }

  const isReady = previewLoadState === "ready";
  const statusText =
    previewLoadState === "loading"
      ? "Loading soundtrack..."
      : previewLoadState === "error"
        ? "Preview failed to load"
        : "Ready";
  const playerLabel =
    asset.selectionType === "curated" ? "Curated soundtrack" : "Country soundtrack";

  const audioElement = (
    <audio
      key={asset.sourceId}
      ref={audioRef}
      src={asset.audioUrl}
      preload="auto"
      onCanPlay={() => setPreviewLoadState("ready")}
      onCanPlayThrough={() => setPreviewLoadState("ready")}
      onLoadedMetadata={(event) => {
        const audioDuration = event.currentTarget.duration;
        setDuration(Number.isFinite(audioDuration) ? audioDuration : asset.duration);
      }}
      onTimeUpdate={(event) => {
        const audio = event.currentTarget;
        const audioDuration = Number.isFinite(audio.duration)
          ? audio.duration
          : asset.duration;

        setCurrentTime(audio.currentTime);
        setProgress(
          audioDuration > 0 ? (audio.currentTime / audioDuration) * 100 : 0,
        );
      }}
      onEnded={() => setIsPlaying(false)}
      onError={() => {
        setIsPlaying(false);
        setPreviewLoadState("error");
      }}
    />
  );

  if (isMinimized) {
    return (
      <section className="relative overflow-hidden rounded-[1.35rem] border border-white/14 bg-atlas-ink/58 px-4 py-3 text-white shadow-soft-xl backdrop-blur-2xl transition-all duration-300">
        {audioElement}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10"
          aria-hidden="true"
        />
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-xl bg-white/10 bg-cover bg-center opacity-85"
            style={{
              backgroundImage: asset.artworkUrl
                ? `url(${asset.artworkUrl})`
                : undefined,
            }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{asset.title}</p>
            <p className="mt-0.5 truncate text-xs text-white/55">{asset.creator}</p>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-white/12"
              role="progressbar"
              aria-label={`${asset.title} playback progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-atlas-ink shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-white/70"
            style={{ backgroundColor: accentColor }}
            type="button"
            onClick={togglePlayback}
            disabled={!isReady}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? (
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="ml-0.5 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          {onToggleMinimized ? (
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/74 transition hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              type="button"
              onClick={onToggleMinimized}
              aria-label="Expand player"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 15 6-6 6 6" />
              </svg>
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[1.55rem] border border-white/12 bg-atlas-ink/58 p-5 text-white shadow-2xl shadow-atlas-ink/20 backdrop-blur-2xl transition-shadow duration-500 ${
        isPlaying ? "shadow-atlas-gold/25" : ""
      }`}
    >
      {audioElement}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            {playerLabel}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-normal">
            {asset.title}
          </h3>
          <p className="mt-1 text-sm text-white/65">{asset.creator}</p>
        </div>
      </div>

      <div className="mt-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-label={`${asset.title} playback progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: accentColor,
              boxShadow: isPlaying ? `0 0 18px ${accentColor}` : "none",
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/45">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full text-atlas-ink shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-atlas-ink"
          style={{ backgroundColor: accentColor }}
          type="button"
          onClick={togglePlayback}
          disabled={!isReady}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isPlaying ? (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="ml-0.5 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-white/70"
          type="button"
          onClick={resetPlayback}
          disabled={!isReady}
          aria-label="Replay preview"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v6h6" />
          </svg>
        </button>
        <p className="ml-auto text-right text-xs font-medium text-white/40">
          {statusText}
        </p>
      </div>

      <div className="mt-5 border-t border-white/10 pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-xs font-medium text-white/45 transition hover:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
          onClick={() => setDetailsOpen((current) => !current)}
          aria-expanded={detailsOpen}
        >
          <span>Details</span>
          <span>Source: iTunes preview</span>
        </button>

        {detailsOpen ? (
          <div className="mt-3 space-y-2 text-xs leading-5 text-white/55">
            <p>{asset.attributionText}</p>
            <p>
              <a
                className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
                href={asset.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Track
              </a>
              {" / "}
              <a
                className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
                href={asset.licenseUrl}
                target="_blank"
                rel="noreferrer"
              >
                Terms
              </a>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
