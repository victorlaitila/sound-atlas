"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  type GeographyDatum,
} from "react-simple-maps";
import worldAtlas from "world-atlas/countries-110m.json";
import {
  countryMetadataByMapId,
  getCountryMetadataByMapName,
  getMapCountryId,
} from "@/data/countryMetadata";

type WorldMapProps = {
  selectedCountryId: string | null;
  onCountrySelect: (countryId: string) => void;
};

const mapData = worldAtlas as unknown;

function getCountryName(geography: GeographyDatum, countryId: string) {
  const properties = geography.properties as
    | {
        name?: string;
        NAME?: string;
      }
    | undefined;

  return (
    properties?.name ??
    properties?.NAME ??
    countryMetadataByMapId[countryId]?.name ??
    "Unknown country"
  );
}

export function WorldMap({ selectedCountryId, onCountrySelect }: WorldMapProps) {
  return (
    <section
      className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(150deg,rgba(16,24,32,0.96),rgba(21,59,68,0.92)_48%,rgba(31,111,100,0.85))] p-4 shadow-soft-xl sm:p-6"
      aria-label="Choose a country"
    >
      <div className="flex h-full min-h-[34rem] items-center">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 170, center: [12, 10] }}
          className="h-auto w-full"
          width={980}
          height={560}
        >
          <Geographies geography={mapData}>
            {({ geographies }) =>
              geographies.map((geography) => {
                const mapCountryName = getCountryName(geography, "");
                const countryId =
                  getMapCountryId(geography.id, mapCountryName) ??
                  geography.rsmKey;
                const metadata =
                  countryMetadataByMapId[countryId] ??
                  getCountryMetadataByMapName(mapCountryName);
                const countryName = metadata?.name ?? mapCountryName;
                const isSelected = selectedCountryId === countryId;

                return (
                  <Geography
                    key={geography.rsmKey}
                    geography={geography}
                    role="button"
                    tabIndex={0}
                    aria-label={`${countryName} soundtrack`}
                    onClick={() => onCountrySelect(countryId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onCountrySelect(countryId);
                      }
                    }}
                    className="cursor-pointer outline-none transition duration-200"
                    style={{
                      default: {
                        fill: isSelected
                          ? "#f3c75f"
                          : "rgba(219, 231, 228, 0.52)",
                        stroke: isSelected
                          ? "#ffffff"
                          : "rgba(255,255,255,0.25)",
                        strokeWidth: isSelected ? 1.45 : 0.65,
                      },
                      hover: {
                        fill: "#f3c75f",
                        stroke: "#ffffff",
                        strokeWidth: 1.1,
                      },
                      pressed: {
                        fill: "#df6d5d",
                        stroke: "#ffffff",
                        strokeWidth: 1.2,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
    </section>
  );
}
