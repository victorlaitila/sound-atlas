import { describe, expect, it } from "vitest";
import {
  countryMetadata,
  countryMetadataByMapId,
  getCountryMetadataByMapName,
  getMapCountryId,
} from "@/data/countryMetadata";

const finland = countryMetadata.find((country) => country.isoCode === "FI")!;

describe("getCountryMetadataByMapName", () => {
  it("resolves a real country name case-insensitively", () => {
    expect(getCountryMetadataByMapName("Finland")?.isoCode).toBe("FI");
    expect(getCountryMetadataByMapName("FINLAND")?.isoCode).toBe("FI");
    expect(getCountryMetadataByMapName(" finland ".trim())?.isoCode).toBe("FI");
  });

  it("resolves a manually-mapped territory not present in world-countries", () => {
    expect(getCountryMetadataByMapName("Kosovo")?.name).toBe("Kosovo");
  });

  it("returns null for an unknown name", () => {
    expect(getCountryMetadataByMapName("Not A Real Country")).toBeNull();
  });
});

describe("getMapCountryId", () => {
  it("resolves via numeric code when it matches a known map id", () => {
    expect(getMapCountryId(finland.numericCode!, finland.name)).toBe(
      finland.mapId,
    );
  });

  it("falls back to the map name when the numeric code is missing", () => {
    expect(getMapCountryId(undefined, finland.name)).toBe(finland.mapId);
  });

  it("falls back to the map name for manually-mapped territories", () => {
    const kosovoMapId = getMapCountryId(undefined, "Kosovo");

    expect(kosovoMapId).toBe("XKX");
    expect(countryMetadataByMapId[kosovoMapId ?? ""]?.name).toBe("Kosovo");
  });

  it("returns null when nothing matches", () => {
    expect(getMapCountryId(undefined, "Nowhere Land")).toBeNull();
  });
});
