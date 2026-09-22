import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../../app/api/audio/route";

function requestFor(countryCode: string | null) {
  const url = new URL("http://localhost/api/audio");
  if (countryCode !== null) {
    url.searchParams.set("countryCode", countryCode);
  }
  return new Request(url);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/audio", () => {
  it("returns 400 when countryCode is missing", async () => {
    const response = await GET(requestFor(null));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "countryCode is required",
      results: [],
    });
  });

  it("returns 404 for an unrecognized countryCode", async () => {
    const response = await GET(requestFor("ZZ"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Country metadata was not found",
      results: [],
    });
  });

  it("returns 502 when the soundtrack search fails unexpectedly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("malformed iTunes response");
        },
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(requestFor("FI"));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Soundtrack search could not be completed",
      results: [],
    });
  });
});
