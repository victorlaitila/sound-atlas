import soundtrackSeed from "./soundAtlasCuratedSongs.json";
import type { CountryMetadata } from "./countryMetadata";

export type CuratedTrack = {
  artist: string;
  title: string;
  searchTerm: string;
};

export type CuratedSoundtrackEntry = {
  countryCode: string;
  candidateTracks: CuratedTrack[];
  fallbackSearchTerms: string[];
};

type SoundtrackSeed = {
  version: number;
  countries: CuratedSoundtrackEntry[];
};

export type DynamicFallbackQueries = {
  primaryQuery: string;
  backupQueries: string[];
};

export type SoundtrackSelectionProfile = {
  curatedEntry: CuratedSoundtrackEntry | null;
  dynamicFallback: DynamicFallbackQueries;
};

function buildDynamicFallback(metadata: CountryMetadata): DynamicFallbackQueries {
  const countryName = metadata.name;

  return {
    primaryQuery: `${countryName} music`,
    backupQueries: [`${countryName} folk music`, `${countryName} traditional music`],
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
    dynamicFallback: buildDynamicFallback(metadata),
  };
}
