"use client";

import { useEffect, useState } from "react";
import { AudioPlayer, AudioPlayerSkeleton } from "@/components/AudioPlayer";
import type { CountryMetadata } from "@/data/countryMetadata";
import type { AudioAsset } from "@/types/audio";
import { Minus } from "lucide-react";

type CountryPanelProps = {
  metadata: CountryMetadata | null;
  audioAssets: AudioAsset[];
  audioStatus: "idle" | "loading" | "ready" | "empty" | "error";
};

function getPlaceLine(metadata: CountryMetadata) {
  return [metadata.capital, metadata.region.split(" / ").at(-1) ?? metadata.region]
    .filter(Boolean)
    .join(", ");
}

export function CountryPanel({
  metadata,
  audioAssets,
  audioStatus,
}: CountryPanelProps) {
  const bestAudioAsset = audioAssets[0] ?? null;
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setIsMinimized(false);
  }, [metadata?.isoCode]);

  if (!metadata) {
    return null;
  }

  return (
    <aside
      className={`origin-bottom-right ${
        isMinimized && bestAudioAsset
          ? "soundatlas-mini-in ml-auto w-full max-w-[28rem]"
          : "soundatlas-panel-in max-h-[62vh] overflow-y-auto rounded-[1.45rem] border-2 border-atlas-goldDark/30 bg-atlas-ink/55 p-4 text-white shadow-soft-xl backdrop-blur-2xl sm:p-5 lg:max-h-[calc(100vh-3rem)]"
      }`}
    >
      <div className={isMinimized && bestAudioAsset ? "hidden" : ""}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-white/92 sm:text-3xl">
              {metadata.name}
            </h2>
            <p className="mt-1.5 text-xs font-medium text-atlas-gold/90 sm:text-sm">
              {getPlaceLine(metadata)}
            </p>
          </div>
          {bestAudioAsset ? (
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-atlas-goldDark/50 text-atlas-goldDark transition hover:border-atlas-goldDark hover:bg-atlas-goldDark/10 focus:outline-none focus:ring-2 focus:ring-atlas-goldDark/50"
              type="button"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize player"
            >
              <Minus className="h-4 w-4" />
            </button>
          ) : (
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full bg-atlas-gold shadow-lg shadow-atlas-gold/25"
              aria-hidden="true"
            />
          )}
        </div>

        <p className="mt-2 text-sm font-medium leading-6 text-atlas-slate">
          A small window into the music of {metadata.name}.
        </p>
      </div>

      <div className={isMinimized && bestAudioAsset ? "hidden" : ""}>
        {audioStatus === "loading" ? (
          <div className="mt-4">
            <AudioPlayerSkeleton />
          </div>
        ) : null}
      </div>

      {bestAudioAsset ? (
        <div className={isMinimized ? "" : "mt-4"}>
          <AudioPlayer
            asset={bestAudioAsset}
            accentColor="#f3c75f"
            isMinimized={isMinimized}
            onToggleMinimized={() => setIsMinimized((current) => !current)}
          />
        </div>
      ) : null}

      <div className={isMinimized && bestAudioAsset ? "hidden" : ""}>
        {audioStatus === "empty" || audioStatus === "error" ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/6 p-4">
            <p className="text-sm font-semibold text-white/86">
              Soundtrack not available yet
            </p>
            <p className="mt-2 text-sm leading-6 text-white/56">
              This place is waiting for the right preview. Better silence than the
              wrong song.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
