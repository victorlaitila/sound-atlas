"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioAsset } from "@/types/audio";
import { Globe, Minus, Pause, Play, Rewind } from "lucide-react";

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

function ArtworkTile({
  artworkUrl,
  label,
  countryCode,
  compact = false,
}: {
  artworkUrl: string | null;
  label: string;
  countryCode: string;
  compact?: boolean;
}) {
  if (artworkUrl) {
    return (
      <div
        className={
          compact
            ? "h-12 w-12 shrink-0 rounded-xl bg-white/10 bg-cover bg-center opacity-85"
            : "aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/8 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_32px_rgba(0,0,0,0.26)]"
        }
        style={{ backgroundImage: `url(${artworkUrl})` }}
        role="img"
        aria-label={`${label} artwork`}
      />
    );
  }

  return (
    <div
      className={
        compact
          ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-[0.65rem] font-semibold tracking-[0.18em] text-white/50"
          : "flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_34%_24%,rgba(243,199,95,0.16),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_32px_rgba(0,0,0,0.22)]"
      }
      role="img"
      aria-label={`${label} artwork placeholder`}
    >
      {compact ? (
        <span>{countryCode}</span>
      ) : (
        <div className="flex flex-col items-center gap-2 text-white/48">
          <Globe className="h-7 w-7 text-atlas-gold/76" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
            {countryCode}
          </span>
        </div>
      )}
    </div>
  );
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
      <section className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#061017]/72 px-4 py-3 text-white shadow-soft-xl backdrop-blur-2xl transition-[background-color,box-shadow,opacity,transform] duration-300">
        {audioElement}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10"
          aria-hidden="true"
        />
        <div className="flex items-center gap-3">
          <ArtworkTile
            artworkUrl={asset.artworkUrl}
            label={asset.title}
            countryCode={asset.countryCode}
            compact
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
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          {onToggleMinimized ? (
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/74 transition hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              type="button"
              onClick={onToggleMinimized}
              aria-label="Expand player"
            >
              <Minus className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(3,14,20,0.88),rgba(8,32,36,0.72))] p-3.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_20px_54px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-shadow duration-500 sm:p-4 ${
        isPlaying ? "shadow-atlas-gold/25" : ""
      }`}
    >
      {audioElement}

      <div className="grid gap-4 sm:grid-cols-[8.25rem,1fr] sm:items-start lg:grid-cols-[9rem,1fr] lg:gap-5">
        <ArtworkTile
          artworkUrl={asset.artworkUrl}
          label={asset.title}
          countryCode={asset.countryCode}
        />

        <div className="min-w-0">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/44">
              {playerLabel}
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight tracking-normal text-white/92 sm:text-2xl">
              {asset.title}
            </h3>
            <p className="mt-1 text-sm text-white/58">{asset.creator}</p>
          </div>

          <div className="mt-5">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-white/18"
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
            <div className="mt-2 flex justify-between text-xs text-white/42">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-atlas-gold/70 text-atlas-gold shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition hover:scale-105 hover:bg-atlas-gold hover:text-atlas-ink disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-atlas-gold focus:outline-none focus:ring-2 focus:ring-atlas-gold/70"
              type="button"
              onClick={togglePlayback}
              disabled={!isReady}
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/16 text-white/68 transition hover:border-atlas-gold/45 hover:bg-white/8 hover:text-atlas-gold disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-white/60"
              type="button"
              onClick={resetPlayback}
              disabled={!isReady}
              aria-label="Replay preview"
            >
              <Rewind className="h-4 w-4" />
            </button>
            <p className="ml-auto text-right text-xs font-medium text-white/40">
              {statusText}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-xs font-medium text-white/44 transition hover:text-white/68 focus:outline-none focus:ring-2 focus:ring-white/30"
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
