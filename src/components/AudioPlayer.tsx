"use client";

import { useRef, useState } from "react";
import type { AudioAsset } from "@/types/audio";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

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
            ? "h-11 w-11 shrink-0 rounded-xl bg-white/10 bg-cover bg-center opacity-85"
            : "aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/8 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_32px_rgba(0,0,0,0.26)] sm:aspect-auto sm:h-full"
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
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-[0.65rem] font-semibold tracking-[0.18em] text-white/50"
          : "flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_34%_24%,rgba(243,199,95,0.16),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_32px_rgba(0,0,0,0.22)] sm:aspect-auto sm:h-full"
      }
      role="img"
      aria-label={`${label} artwork placeholder`}
    >
      {compact ? (
        <span>{countryCode}</span>
      ) : (
        <div className="flex flex-col items-center gap-2 text-white/48">
          <Globe className="h-7 w-7 text-atlas-goldDark/76" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
            {countryCode}
          </span>
        </div>
      )}
    </div>
  );
}

export function AudioPlayerSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.2rem] border border-atlas-goldDark/30 bg-[linear-gradient(145deg,rgba(3,14,20,0.88),rgba(8,32,36,0.72))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_20px_54px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-3.5"
      aria-hidden="true"
    >
      <div className="grid animate-pulse gap-3 sm:grid-cols-[7.25rem,1fr] lg:grid-cols-[7.75rem,1fr] lg:gap-4">
        <div className="aspect-square w-full rounded-2xl border border-white/10 bg-white/8 sm:aspect-auto sm:h-full" />

        <div className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-2 w-20 rounded-full bg-white/10" />
              <div className="h-4 w-4/5 rounded-full bg-white/14" />
              <div className="h-3 w-2/5 rounded-full bg-white/8" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-9 w-9 rounded-full border border-white/10 bg-white/6" />
              <div className="h-9 w-9 rounded-full border border-white/10 bg-white/6" />
            </div>
          </div>

          <div className="mt-3">
            <div className="h-1 rounded-full bg-white/10" />
            <div className="mt-2 flex justify-between">
              <div className="h-2 w-8 rounded-full bg-white/8" />
              <div className="h-2 w-8 rounded-full bg-white/8" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <div className="flex animate-pulse items-center justify-between">
          <div className="h-2.5 w-12 rounded-full bg-white/8" />
          <div className="h-2.5 w-24 rounded-full bg-white/8" />
        </div>
      </div>
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

  // Reset playback state when the track changes
  const [resetForAssetId, setResetForAssetId] = useState(asset.sourceId);
  if (resetForAssetId !== asset.sourceId) {
    setResetForAssetId(asset.sourceId);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(asset.duration);
    setPreviewLoadState("loading");
    setDetailsOpen(false);
  }

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
    } catch (error) {
      console.error(`Preview playback failed for ${asset.sourceId}`, error);
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
      <section className="relative overflow-hidden rounded-[1.2rem] border-2 border-atlas-goldDark/30 bg-[#061017]/72 px-3.5 py-2.5 text-white shadow-soft-xl backdrop-blur-2xl transition-[background-color,box-shadow,opacity,transform] duration-300">
        {audioElement}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2.5">
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
              className="mt-2 h-1 overflow-hidden rounded-full bg-white/20"
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
                  boxShadow: isPlaying ? `0 0 10px ${accentColor}` : "none",
                }}
              />
            </div>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-atlas-goldDark/70 text-atlas-goldDark shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition hover:scale-105 hover:bg-atlas-gold hover:text-atlas-ink disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-atlas-goldDark focus:outline-none focus:ring-2 focus:ring-atlas-goldDark/70"
            type="button"
            onClick={togglePlayback}
            disabled={!isReady}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4" fill="currentColor" />
            )}
          </button>
          {onToggleMinimized ? (
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-atlas-goldDark/40 text-atlas-goldDark transition hover:border-atlas-gold/70 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-atlas-goldDark/40"
              type="button"
              onClick={onToggleMinimized}
              aria-label="Expand player"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`overflow-hidden rounded-[1.2rem] border border-atlas-goldDark/30 bg-[linear-gradient(145deg,rgba(3,14,20,0.88),rgba(8,32,36,0.72))] p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_20px_54px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-shadow duration-500 sm:p-3.5 ${
        isPlaying ? "shadow-atlas-gold/25" : ""
      }`}
    >
      {audioElement}

      <div className="grid gap-3 sm:grid-cols-[7.25rem,1fr] lg:grid-cols-[7.75rem,1fr] lg:gap-4">
        <ArtworkTile
          artworkUrl={asset.artworkUrl}
          label={asset.title}
          countryCode={asset.countryCode}
        />

        <div className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-atlas-slate">
                {playerLabel}
              </p>
              <h3 className="mt-1.5 text-lg font-semibold leading-tight tracking-normal text-white/92 sm:text-xl">
                {asset.title}
              </h3>
              <p className="mt-0.5 text-xs text-white/58">{asset.creator}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-atlas-goldDark/70 text-atlas-goldDark shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition hover:scale-105 hover:bg-atlas-gold hover:text-atlas-ink disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-atlas-goldDark focus:outline-none focus:ring-2 focus:ring-atlas-goldDark/70"
                type="button"
                onClick={togglePlayback}
                disabled={!isReady}
                aria-label={isPlaying ? "Pause preview" : "Play preview"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="h-4 w-4" fill="currentColor" />
                )}
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-atlas-goldDark/70 text-atlas-goldDark/85 transition hover:bg-white/8 hover:text-atlas-gold disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-atlas-goldDark/70"
                type="button"
                onClick={resetPlayback}
                disabled={!isReady}
                aria-label="Replay preview"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="sr-only" role="status">
            {statusText}
          </p>

          <div className="mt-3">
            <div
              className="relative h-1 rounded-full bg-white/20"
              role="progressbar"
              aria-label={`${asset.title} playback progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: accentColor,
                  boxShadow: isPlaying ? `0 0 18px ${accentColor}` : "none",
                }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition-all duration-300"
                style={{
                  left: `${Math.min(Math.max(progress, 0), 100)}%`,
                  backgroundColor: accentColor,
                }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/50">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <button
          type="button"
          className="flex w-full items-center justify-between text-xs font-medium text-atlas-slate transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={() => setDetailsOpen((current) => !current)}
          aria-expanded={detailsOpen}
        >
          <span className="flex items-center gap-1">
            Details
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                detailsOpen ? "rotate-180" : ""
              }`}
            />
          </span>
          <span>Source: iTunes preview</span>
        </button>

        {detailsOpen ? (
          <div className="mt-2.5 space-y-1.5 text-xs leading-5 text-white/55">
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
