import { NextResponse } from "next/server";
import { lookupSoundtracksForCountryCode } from "@/server/audio/soundtrackLookup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await lookupSoundtracksForCountryCode(
    searchParams.get("countryCode"),
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, results: result.results },
      { status: result.statusCode },
    );
  }

  return NextResponse.json({ results: result.results });
}
