import soundtrackSeed from "./soundAtlasCuratedSongs.json";
import {
  dynamicCountryMusicFallbackByCode,
  type DynamicCountryMusicCuration,
} from "./dynamicCountryMusic";
import type { CountryMetadata } from "./countryMetadata";

export type CuratedTrack = {
  artist: string;
  title: string;
  searchTerm: string;
};

export type CuratedSoundtrackEntry = {
  countryCode: string;
  primaryTrack: CuratedTrack;
  fallbackSearchTerms: string[];
  blockedTerms?: string[];
};

type SoundtrackSeed = {
  version: number;
  countries: CuratedSoundtrackEntry[];
};

export type SoundtrackSelectionProfile = {
  curatedEntry: CuratedSoundtrackEntry | null;
  dynamicFallback: DynamicCountryMusicCuration;
};

function buildDefaultDynamicFallback(
  metadata: CountryMetadata,
): DynamicCountryMusicCuration {
  const countryName = metadata.name;

  return {
    countryCode: metadata.isoCode ?? metadata.isoAlpha3 ?? metadata.mapId,
    primaryQuery: `${countryName} music`,
    backupQueries: [`${countryName} folk music`, `${countryName} traditional music`],
    blockedTerms: [],
    preferredGenres: ["world", "folk", "pop", "traditional"],
    notes: `Generic dynamic fallback for ${countryName}.`,
  };
}

export const curatedSoundtrackSeed = soundtrackSeed as SoundtrackSeed;

export const curatedSoundtracksByCountryCode =
  curatedSoundtrackSeed.countries.reduce<Record<string, CuratedSoundtrackEntry>>(
    (entriesByCode, entry) => {
      entriesByCode[entry.countryCode] = entry;
      return entriesByCode;
    },
    {},
  );

export function getSoundtrackSelectionProfile(
  metadata: CountryMetadata,
): SoundtrackSelectionProfile {
  const countryCode = metadata.isoCode ?? metadata.isoAlpha3 ?? metadata.mapId;

  return {
    curatedEntry: curatedSoundtracksByCountryCode[countryCode] ?? null,
    dynamicFallback:
      dynamicCountryMusicFallbackByCode[countryCode] ??
      buildDefaultDynamicFallback(metadata),
  };
}
