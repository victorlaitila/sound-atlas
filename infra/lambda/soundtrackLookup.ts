import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { lookupSoundtracksForCountryCode } from "../../src/server/audio/soundtrackLookup";
import type { AudioAsset } from "../../src/types/audio";

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? 7 * 24 * 60 * 60);
const CACHE_TABLE_NAME = process.env.CACHE_TABLE_NAME;
const dynamoDb = new DynamoDBClient({});

type HttpApiEvent = {
  body?: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined> | null;
};

type CachedSoundtrack = {
  soundtrack: AudioAsset;
  cachedAt: string;
  ttl: number;
};

const jsonHeaders = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function parseBodyCountryCode(event: HttpApiEvent) {
  if (!event.body) {
    return null;
  }

  try {
    const bodyText = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    const body = JSON.parse(bodyText) as { countryCode?: unknown };
    return typeof body.countryCode === "string" ? body.countryCode : null;
  } catch {
    return null;
  }
}

function getRequestedCountryCode(event: HttpApiEvent) {
  return (
    event.queryStringParameters?.countryCode ??
    event.queryStringParameters?.country ??
    parseBodyCountryCode(event)
  )?.toUpperCase();
}

function parseCachedSoundtrack(rawSoundtrack: string | undefined) {
  if (!rawSoundtrack) {
    return null;
  }

  try {
    const soundtrack = JSON.parse(rawSoundtrack) as AudioAsset;
    return typeof soundtrack.audioUrl === "string" &&
      typeof soundtrack.title === "string"
      ? soundtrack
      : null;
  } catch {
    return null;
  }
}

async function getCachedSoundtrack(
  countryCode: string,
): Promise<CachedSoundtrack | null> {
  if (!CACHE_TABLE_NAME) {
    return null;
  }

  const response = await dynamoDb.send(
    new GetItemCommand({
      TableName: CACHE_TABLE_NAME,
      Key: {
        countryCode: { S: countryCode },
      },
      ConsistentRead: false,
    }),
  );

  const ttl = Number(response.Item?.ttl?.N ?? 0);

  if (!response.Item || ttl <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const soundtrack = parseCachedSoundtrack(response.Item.soundtrack?.S);

  if (!soundtrack) {
    return null;
  }

  return {
    soundtrack,
    cachedAt: response.Item.cachedAt?.S ?? soundtrack.fetchedAt,
    ttl,
  };
}

async function cacheSoundtrack(countryCode: string, soundtrack: AudioAsset) {
  if (!CACHE_TABLE_NAME) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = now + CACHE_TTL_SECONDS;
  const cachedAt = new Date(now * 1000).toISOString();

  await dynamoDb.send(
    new PutItemCommand({
      TableName: CACHE_TABLE_NAME,
      Item: {
        countryCode: { S: countryCode },
        cachedAt: { S: cachedAt },
        ttl: { N: String(ttl) },
        soundtrack: { S: JSON.stringify(soundtrack) },
        title: { S: soundtrack.title },
        creator: { S: soundtrack.creator },
        artworkUrl: { S: soundtrack.artworkUrl ?? "" },
        previewUrl: { S: soundtrack.audioUrl },
      },
    }),
  );
}

export async function handler(event: HttpApiEvent) {
  const countryCode = getRequestedCountryCode(event);

  if (!countryCode) {
    return jsonResponse(400, {
      error: "countryCode is required",
      results: [],
    });
  }

  const cached = await getCachedSoundtrack(countryCode);

  if (cached) {
    return jsonResponse(200, {
      countryCode,
      cache: {
        hit: true,
        cachedAt: cached.cachedAt,
      },
      results: [cached.soundtrack],
    });
  }

  const lookupResult = await lookupSoundtracksForCountryCode(countryCode);

  if (!lookupResult.ok) {
    return jsonResponse(lookupResult.statusCode, {
      error: lookupResult.error,
      results: lookupResult.results,
    });
  }

  const soundtrack = lookupResult.results[0] ?? null;

  if (soundtrack) {
    await cacheSoundtrack(countryCode, soundtrack);
  }

  return jsonResponse(200, {
    countryCode: lookupResult.countryCode,
    cache: {
      hit: false,
    },
    results: lookupResult.results,
  });
}
