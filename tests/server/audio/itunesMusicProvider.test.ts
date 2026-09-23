import { afterEach, describe, expect, it, vi } from "vitest";
import { countryMetadataByIsoCode, type CountryMetadata } from "@/data/countryMetadata";
import { itunesMusicProvider } from "@/server/audio/itunesMusicProvider";

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

const finland = countryMetadataByIsoCode.FI;
const italy = countryMetadataByIsoCode.IT;

const unknownCountry: CountryMetadata = {
  mapId: "999",
  name: "Testland",
  aliases: [],
  isoCode: "ZZ",
  isoAlpha3: "ZZZ",
  numericCode: "999",
  region: "Test Region",
  capital: "Test City",
  searchTerms: ["Testland traditional music"],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("itunesMusicProvider", () => {
  it("returns the curated track when iTunes has a strong match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          resultCount: 1,
          results: [
            {
              trackId: 111,
              trackName: "Blind and Frozen",
              artistName: "Beast In Black",
              collectionName: "Dark Connection",
              trackViewUrl: "https://itunes.apple.com/track/111",
              previewUrl: "https://audio.example/preview111.m4a",
              artworkUrl100: "https://img.example/art100x100bb.jpg",
              primaryGenreName: "Metal",
              trackTimeMillis: 210000,
            },
          ],
        }),
      ),
    );

    const results = await itunesMusicProvider(finland);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      source: "itunes",
      title: "Blind and Frozen",
      creator: "Beast In Black",
      audioUrl: "https://audio.example/preview111.m4a",
      artworkUrl: "https://img.example/art600x600bb.jpg",
      selectionType: "curated",
    });
    expect(results[0].relationScore).toBeGreaterThanOrEqual(92);
  });

  it("returns no results when iTunes has nothing playable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ resultCount: 0, results: [] })),
    );

    const results = await itunesMusicProvider(unknownCountry);

    expect(results).toEqual([]);
  });

  it("prefers the country's own storefront over the US fallback even when the fallback would score higher", async () => {
    // Storefronts are queried concurrently now (for latency), but the
    // country-specific storefront must still win over the US fallback
    // whenever it has any passing result of its own — matching the original
    // sequential "search country storefront, only fall back to US if empty"
    // behavior.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: URL) => {
        const storefront = url.searchParams.get("country");

        if (storefront === "FI") {
          return jsonResponse({
            resultCount: 1,
            results: [
              {
                trackId: 333,
                trackName: "Blind and Frozen",
                artistName: "Someone Else Entirely",
                collectionName: "A Compilation",
                previewUrl: "https://audio.example/preview333.m4a",
                artworkUrl100: "https://img.example/art100.jpg",
                primaryGenreName: "Metal",
              },
            ],
          });
        }

        return jsonResponse({
          resultCount: 1,
          results: [
            {
              trackId: 444,
              trackName: "Blind and Frozen",
              artistName: "Beast In Black",
              collectionName: "Dark Connection",
              previewUrl: "https://audio.example/preview444.m4a",
              artworkUrl100: "https://img.example/art100.jpg",
              primaryGenreName: "Metal",
              trackTimeMillis: 210000,
            },
          ],
        });
      }),
    );

    const results = await itunesMusicProvider(finland);

    expect(results).toHaveLength(1);
    expect(results[0].creator).toBe("Someone Else Entirely");
  });

  it("falls through to the next candidate track when the first one isn't found on iTunes", async () => {
    // Italy's curated entry has two candidate tracks: a newer researched
    // pick first, and the country's previous pick kept as a fallback. If
    // the first one has nothing findable, the second should still play
    // rather than falling all the way through to generic search terms.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: URL) => {
        const term = url.searchParams.get("term") ?? "";

        if (term.includes("Paola Turci")) {
          return jsonResponse({
            resultCount: 1,
            results: [
              {
                trackId: 555,
                trackName: "Un'emozione da poco",
                artistName: "Paola Turci",
                collectionName: "Un'emozione da poco",
                previewUrl: "https://audio.example/preview555.m4a",
                artworkUrl100: "https://img.example/art100.jpg",
                primaryGenreName: "Pop",
              },
            ],
          });
        }

        return jsonResponse({ resultCount: 0, results: [] });
      }),
    );

    const results = await itunesMusicProvider(italy);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      creator: "Paola Turci",
      title: "Un'emozione da poco",
    });
  });
});
