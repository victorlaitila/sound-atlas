import { countryMetadataByIsoCode } from "../../data/countryMetadata";
import { itunesMusicProvider } from "./itunesMusicProvider";
import type { AudioAsset } from "../../types/audio";

export type SoundtrackLookupResult =
  | {
      ok: true;
      countryCode: string;
      results: AudioAsset[];
    }
  | {
      ok: false;
      statusCode: 400 | 404 | 502;
      error: string;
      results: [];
    };

export async function lookupSoundtracksForCountryCode(
  rawCountryCode: string | null | undefined,
): Promise<SoundtrackLookupResult> {
  const countryCode = rawCountryCode?.trim().toUpperCase();

  if (!countryCode) {
    return {
      ok: false,
      statusCode: 400,
      error: "countryCode is required",
      results: [],
    };
  }

  const metadata = countryMetadataByIsoCode[countryCode];

  if (!metadata) {
    return {
      ok: false,
      statusCode: 404,
      error: "Country metadata was not found",
      results: [],
    };
  }

  try {
    return {
      ok: true,
      countryCode,
      results: await itunesMusicProvider(metadata),
    };
  } catch {
    return {
      ok: false,
      statusCode: 502,
      error: "Soundtrack search could not be completed",
      results: [],
    };
  }
}
