"use client";

import { AudioPlayer } from "@/components/AudioPlayer";
import type { CountryMetadata } from "@/data/countryMetadata";
import type { AudioAsset } from "@/types/audio";

type CountryPanelProps = {
  metadata: CountryMetadata | null;
  audioAssets: AudioAsset[];
  audioStatus: "idle" | "loading" | "ready" | "empty" | "error";
};

function SoundtrackLoadingCard() {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-atlas-ink">
        Loading soundtrack...
      </p>
      <div className="mt-4 space-y-3">
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-atlas-ocean/15" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-atlas-ocean/15" />
        <div className="h-20 animate-pulse rounded-3xl bg-atlas-ocean/10" />
      </div>
    </div>
  );
}

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

  if (!metadata) {
    return (
      <aside className="flex min-h-[28rem] flex-col justify-between rounded-[2rem] border border-white/60 bg-white/55 p-6 shadow-soft-xl backdrop-blur-xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-atlas-pine">
            Choose a country
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal text-atlas-ink">
            The atlas is ready.
          </h2>
          <p className="mt-4 text-sm leading-6 text-atlas-ocean/75">
            Select a place on the map and let its soundtrack settle in.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-[2rem] border border-white/60 bg-white/64 p-5 shadow-soft-xl backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-normal text-atlas-ink">
            {metadata.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-atlas-ocean/62">
            {getPlaceLine(metadata)}
          </p>
        </div>
        <span
          className="mt-1 h-4 w-4 rounded-full bg-atlas-gold shadow-lg"
          aria-hidden="true"
        />
      </div>

      <p className="mt-5 text-base font-medium leading-7 text-atlas-ocean/78">
        A small window into the music of {metadata.name}, tuned for a first
        listen.
      </p>

      {audioStatus === "loading" ? <SoundtrackLoadingCard /> : null}

      {bestAudioAsset ? (
        <div className="mt-5">
          <AudioPlayer asset={bestAudioAsset} accentColor="#f3c75f" />
        </div>
      ) : null}

      {audioStatus === "empty" || audioStatus === "error" ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-atlas-ink">
            Soundtrack not available yet
          </p>
          <p className="mt-2 text-sm leading-6 text-atlas-ocean/70">
            This place is waiting for the right preview. Better silence than the
            wrong song.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
