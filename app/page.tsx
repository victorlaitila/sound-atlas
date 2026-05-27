"use client";

import { useEffect, useState } from "react";
import { CountryPanel } from "@/components/CountryPanel";
import { WorldMap } from "@/components/WorldMap";
import { countryMetadataByMapId } from "@/data/countryMetadata";
import type { AudioAsset } from "@/types/audio";

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
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="px-1 py-3 sm:px-2 sm:py-5">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-atlas-pine">
              SoundAtlas
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-atlas-ink sm:text-5xl">
              Click a country and hear its sound.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-atlas-ocean/70 sm:text-base">
              A quiet atlas of country soundtracks, one preview at a time.
            </p>
          </div>
        </header>

        <section className="grid min-h-[38rem] gap-5 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <WorldMap
            selectedCountryId={selectedCountryId}
            onCountrySelect={(countryId) => {
              setSelectedCountryId(countryId);
            }}
          />

          <CountryPanel
            metadata={selectedMetadata}
            audioAssets={audioAssets}
            audioStatus={audioStatus}
          />
        </section>
      </div>
    </main>
  );
}
