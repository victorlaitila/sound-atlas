import type { CountryMetadata } from "../../data/countryMetadata";
import type {
  CuratedSoundtrackEntry,
  CuratedTrack,
} from "../../data/soundtracks";
import { getSoundtrackSelectionProfile } from "../../data/soundtracks";
import type {
  DynamicCountryMusicCuration,
} from "../../data/dynamicCountryMusic";
import type { AudioAsset } from "../../types/audio";

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const CURATED_STRONG_SCORE = 118;
const CURATED_MINIMUM_SCORE = 92;
const DYNAMIC_STRONG_SCORE = 98;
const DYNAMIC_MINIMUM_SCORE = 84;

type SearchMode = "curated-primary" | "curated-fallback" | "dynamic";

type ItunesSearchResponse = {
  resultCount?: number;
  results?: ItunesSongResult[];
};

type ItunesSongResult = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  country?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
  composerName?: string;
};

type SearchContext = {
  query: string;
  mode: SearchMode;
  curatedEntry: CuratedSoundtrackEntry | null;
  targetTrack: CuratedTrack | null;
  dynamicFallback: DynamicCountryMusicCuration;
  minimumScore: number;
};

type RankedItunesResult = {
  result: ItunesSongResult;
  context: SearchContext;
  relationScore: number;
  relationReason: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueTerms(terms: string[]) {
  return [...new Set(terms.filter((term) => term.trim()).map((term) => term.trim()))];
}

function getResultText(result: ItunesSongResult) {
  return normalize(
    [
      result.trackName,
      result.artistName,
      result.collectionName,
      result.primaryGenreName,
      result.composerName,
    ].join(" "),
  );
}

function hasTerm(text: string, term: string) {
  return text.includes(normalize(term));
}

function tokenize(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function containsBlockedTerm(
  result: ItunesSongResult,
  context: SearchContext,
  metadata: CountryMetadata,
) {
  const resultText = getResultText(result);
  const blockedTerms = uniqueTerms([
    ...context.dynamicFallback.blockedTerms,
    ...(context.curatedEntry?.blockedTerms ?? []),
  ]);

  if (
    metadata.isoCode !== "SE" &&
    metadata.isoCode !== "NO" &&
    metadata.isoCode !== "FI"
  ) {
    return blockedTerms.some((term) => hasTerm(resultText, term));
  }

  return blockedTerms.some((term) => hasTerm(resultText, term));
}

function scoreTargetTrack(result: ItunesSongResult, targetTrack: CuratedTrack | null) {
  if (!targetTrack) {
    return 0;
  }

  const resultText = getResultText(result);
  const artistText = normalize(
    [result.artistName, result.composerName, result.collectionName].join(" "),
  );
  const trackText = normalize(result.trackName ?? "");
  const targetArtist = normalize(targetTrack.artist);
  const targetTitle = normalize(targetTrack.title);

  let score = 0;

  if (artistText.includes(targetArtist)) {
    score += 46;
  } else {
    const artistTokenMatches = tokenize(targetTrack.artist).filter((token) =>
      resultText.includes(token),
    ).length;
    score += Math.min(artistTokenMatches * 12, 30);
  }

  if (trackText.includes(targetTitle) || resultText.includes(targetTitle)) {
    score += 46;
  } else {
    const titleTokenMatches = tokenize(targetTrack.title).filter((token) =>
      resultText.includes(token),
    ).length;
    score += Math.min(titleTokenMatches * 11, 34);
  }

  return score;
}

function scoreQueryRelevance(result: ItunesSongResult, query: string) {
  const resultText = getResultText(result);
  const queryText = normalize(query);

  if (resultText.includes(queryText)) {
    return 30;
  }

  return tokenize(query).reduce(
    (score, token) => score + (resultText.includes(token) ? 7 : 0),
    0,
  );
}

function scoreGenre(result: ItunesSongResult, context: SearchContext) {
  const genre = normalize(result.primaryGenreName ?? "");

  if (!genre) {
    return 0;
  }

  if (
    context.dynamicFallback.preferredGenres.some((term) =>
      genre.includes(normalize(term)),
    )
  ) {
    return 18;
  }

  if (
    ["world", "folk", "latin", "jazz", "blues", "pop", "classical"].some(
      (term) => genre.includes(term),
    )
  ) {
    return 8;
  }

  return 0;
}

function scoreCountrySignals(
  result: ItunesSongResult,
  metadata: CountryMetadata,
  context: SearchContext,
) {
  const resultText = getResultText(result);
  const signalTerms = uniqueTerms([
    metadata.name,
    ...metadata.aliases.slice(0, 4),
    ...metadata.searchTerms.slice(0, 4),
    context.dynamicFallback.primaryQuery,
    ...context.dynamicFallback.backupQueries,
  ]);

  return Math.min(
    signalTerms.reduce(
      (score, term) => score + (hasTerm(resultText, term) ? 10 : 0),
      0,
    ),
    32,
  );
}

function scoreStorefront(result: ItunesSongResult, metadata: CountryMetadata) {
  if (!result.country) {
    return 5;
  }

  return result.country === metadata.isoAlpha3 || result.country === metadata.isoCode
    ? 12
    : 3;
}

function getRelationReason(context: SearchContext) {
  if (context.mode === "curated-primary" && context.targetTrack) {
    return `Curated soundtrack: ${context.targetTrack.artist} - ${context.targetTrack.title}`;
  }

  if (context.mode === "curated-fallback") {
    return "Curated soundtrack fallback";
  }

  return "Dynamic soundtrack fallback";
}

function rankResult(
  result: ItunesSongResult,
  metadata: CountryMetadata,
  context: SearchContext,
): RankedItunesResult | null {
  if (
    !result.previewUrl ||
    !result.trackName ||
    !result.artistName ||
    !result.primaryGenreName ||
    containsBlockedTerm(result, context, metadata)
  ) {
    return null;
  }

  const previewScore = 30;
  const artworkScore = result.artworkUrl100 ? 8 : 0;
  const metadataScore =
    (result.trackName ? 5 : 0) +
    (result.artistName ? 5 : 0) +
    (result.collectionName ? 4 : 0) +
    (result.primaryGenreName ? 5 : 0);
  const targetScore = scoreTargetTrack(result, context.targetTrack);
  const queryScore = scoreQueryRelevance(result, context.query);
  const genreScore = scoreGenre(result, context);
  const countryScore = scoreCountrySignals(result, metadata, context);
  const storefrontScore = scoreStorefront(result, metadata);
  const relationScore =
    previewScore +
    artworkScore +
    metadataScore +
    targetScore +
    queryScore +
    genreScore +
    countryScore +
    storefrontScore;

  if (relationScore < context.minimumScore) {
    return null;
  }

  return {
    result,
    context,
    relationScore,
    relationReason: getRelationReason(context),
  };
}

function toAudioAsset(
  rankedResult: RankedItunesResult,
  metadata: CountryMetadata,
  fetchedAt: string,
): AudioAsset {
  const { result, context } = rankedResult;
  const title = result.trackName ?? "Untitled track";
  const creator = result.artistName ?? "Unknown artist";
  const sourceUrl = result.trackViewUrl ?? result.collectionViewUrl ?? "";

  return {
    source: "itunes",
    sourceId: String(result.trackId ?? `${creator}-${title}`),
    countryCode: metadata.isoCode ?? metadata.isoAlpha3 ?? metadata.mapId,
    title,
    creator,
    sourceUrl,
    audioUrl: result.previewUrl ?? "",
    artworkUrl: result.artworkUrl100
      ? result.artworkUrl100.replace("100x100bb", "600x600bb")
      : null,
    licenseName: "iTunes preview",
    licenseUrl:
      "https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/",
    attributionText: `${title} by ${creator}. Preview provided by iTunes.`,
    duration: result.trackTimeMillis ? result.trackTimeMillis / 1000 : 30,
    tags: uniqueTerms([
      result.primaryGenreName ?? "",
      result.collectionName ?? "",
      context.mode === "dynamic" ? "Dynamic soundtrack" : "Curated soundtrack",
    ]),
    relationScore: Math.round(rankedResult.relationScore),
    relationReason: rankedResult.relationReason,
    selectionType: context.mode === "dynamic" ? "dynamic" : "curated",
    fetchedAt,
  };
}

async function searchItunes(
  metadata: CountryMetadata,
  term: string,
): Promise<ItunesSongResult[]> {
  if (!metadata.isoCode) {
    return [];
  }

  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", metadata.isoCode);
  url.searchParams.set("limit", "10");
  url.searchParams.set("term", term);

  const requestOptions: RequestInit & { next?: { revalidate: number } } = {
    next: { revalidate: 60 * 60 * 6 },
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as ItunesSearchResponse;
  return data.results ?? [];
}

async function findBestForContext(
  metadata: CountryMetadata,
  context: SearchContext,
) {
  const rankedResults = (await searchItunes(metadata, context.query))
    .map((result) => rankResult(result, metadata, context))
    .filter((result): result is RankedItunesResult => result !== null)
    .sort((a, b) => b.relationScore - a.relationScore);

  return rankedResults[0] ?? null;
}

function getCuratedContexts(
  curatedEntry: CuratedSoundtrackEntry,
  dynamicFallback: DynamicCountryMusicCuration,
) {
  const primaryContext: SearchContext = {
    query: curatedEntry.primaryTrack.searchTerm,
    mode: "curated-primary",
    curatedEntry,
    targetTrack: curatedEntry.primaryTrack,
    dynamicFallback,
    minimumScore: CURATED_MINIMUM_SCORE,
  };
  const fallbackContexts = uniqueTerms(curatedEntry.fallbackSearchTerms).map(
    (query): SearchContext => ({
      query,
      mode: "curated-fallback",
      curatedEntry,
      targetTrack: null,
      dynamicFallback,
      minimumScore: CURATED_MINIMUM_SCORE,
    }),
  );

  return [primaryContext, ...fallbackContexts];
}

function getDynamicContexts(dynamicFallback: DynamicCountryMusicCuration) {
  return uniqueTerms([
    dynamicFallback.primaryQuery,
    ...dynamicFallback.backupQueries,
  ]).map(
    (query): SearchContext => ({
      query,
      mode: "dynamic",
      curatedEntry: null,
      targetTrack: null,
      dynamicFallback,
      minimumScore: DYNAMIC_MINIMUM_SCORE,
    }),
  );
}

export async function itunesMusicProvider(
  metadata: CountryMetadata,
): Promise<AudioAsset[]> {
  const { curatedEntry, dynamicFallback } = getSoundtrackSelectionProfile(metadata);
  const candidates: RankedItunesResult[] = [];

  if (curatedEntry) {
    for (const context of getCuratedContexts(curatedEntry, dynamicFallback)) {
      const result = await findBestForContext(metadata, context);

      if (!result) {
        continue;
      }

      candidates.push(result);

      if (
        context.mode === "curated-primary" ||
        result.relationScore >= CURATED_STRONG_SCORE
      ) {
        const fetchedAt = new Date().toISOString();
        return [toAudioAsset(result, metadata, fetchedAt)];
      }
    }
  }

  for (const context of getDynamicContexts(dynamicFallback)) {
    const result = await findBestForContext(metadata, context);

    if (!result) {
      continue;
    }

    candidates.push(result);

    if (result.relationScore >= DYNAMIC_STRONG_SCORE) {
      const fetchedAt = new Date().toISOString();
      return [toAudioAsset(result, metadata, fetchedAt)];
    }
  }

  const bestCandidate = candidates.sort(
    (a, b) => b.relationScore - a.relationScore,
  )[0];

  if (!bestCandidate) {
    return [];
  }

  const fetchedAt = new Date().toISOString();
  return [toAudioAsset(bestCandidate, metadata, fetchedAt)];
}
