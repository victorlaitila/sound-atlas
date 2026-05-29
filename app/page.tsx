"use client";

import { useCallback, useEffect, useState } from "react";
import { CountryPanel } from "@/components/CountryPanel";
import { WorldMap } from "@/components/WorldMap";
import { countryMetadataByMapId } from "@/data/countryMetadata";
import type { AudioAsset } from "@/types/audio";
import { MapPin } from "lucide-react";

type AudioStatus = "idle" | "loading" | "ready" | "empty" | "error";

type SoundtrackResponse = {
  results?: AudioAsset[];
};

const soundAtlasApiBaseUrl = process.env.NEXT_PUBLIC_SOUNDATLAS_API_URL?.replace(
  /\/+$/,
  "",
);

function buildSoundtrackUrl(baseUrl: string, countryCode: string) {
  const params = new URLSearchParams({ countryCode });
  return `${baseUrl}/soundtrack?${params.toString()}`;
}

function buildLocalSoundtrackUrl(countryCode: string) {
  const params = new URLSearchParams({ countryCode });
  return `/api/audio?${params.toString()}`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function fetchSoundtrackResults(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  const data = (await response.json().catch(() => ({}))) as SoundtrackResponse;

  if (!response.ok) {
    throw new Error("Soundtrack request failed");
  }

  return Array.isArray(data.results) ? data.results : [];
}

async function loadSoundtrackResults(countryCode: string, signal: AbortSignal) {
  const localUrl = buildLocalSoundtrackUrl(countryCode);

  if (!soundAtlasApiBaseUrl) {
    return fetchSoundtrackResults(localUrl, signal);
  }

  try {
    return await fetchSoundtrackResults(
      buildSoundtrackUrl(soundAtlasApiBaseUrl, countryCode),
      signal,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    return fetchSoundtrackResults(localUrl, signal);
  }
}

export default function Home() {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");

  const selectedMetadata = selectedCountryId
    ? countryMetadataByMapId[selectedCountryId] ?? null
    : null;

  const handleCountrySelect = useCallback((countryId: string) => {
    setSelectedCountryId(countryId);
  }, []);

  useEffect(() => {
    if (!selectedMetadata?.isoCode) {
      setAudioAssets([]);
      setAudioStatus(selectedMetadata ? "empty" : "idle");
      return;
    }

    const controller = new AbortController();
    const countryCode = selectedMetadata.isoCode;

    async function loadAudioAssets() {
      setAudioAssets([]);
      setAudioStatus("loading");

      try {
        const results = await loadSoundtrackResults(
          countryCode,
          controller.signal,
        );

        setAudioAssets(results);
        setAudioStatus(results.length > 0 ? "ready" : "empty");
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        setAudioStatus("error");
      }
    }

    void loadAudioAssets();

    return () => controller.abort();
  }, [selectedMetadata]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-atlas-ink">
      <WorldMap
        selectedCountryId={selectedCountryId}
        onCountrySelect={handleCountrySelect}
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,14,20,0.3),transparent_42%,rgba(4,14,20,0.16))]"
        aria-hidden="true"
      />

      <header className="pointer-events-none absolute left-5 top-6 z-10 max-w-[calc(100vw-2.5rem)] text-white sm:left-8 sm:top-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-atlas-gold">
          SoundAtlas
        </p>
        <h1 className="mt-3 whitespace-nowrap text-base font-medium tracking-normal text-white/88 sm:text-xl lg:text-2xl">
          Click a country to hear its music.
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm leading-6 text-white/48">
          <MapPin className="h-4 w-4" />
          <p>Drag the globe. Scroll or use the controls to zoom.</p>
        </div>
      </header>

      {selectedMetadata ? (
        <div className="absolute inset-x-4 bottom-4 z-20 sm:inset-x-6 sm:bottom-6 lg:inset-x-auto lg:right-7 lg:w-[32rem] xl:w-[34rem]">
          <CountryPanel
            metadata={selectedMetadata}
            audioAssets={audioAssets}
            audioStatus={audioStatus}
          />
        </div>
      ) : null}
    </main>
  );
}
