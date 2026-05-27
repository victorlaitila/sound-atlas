"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
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
const defaultMapPosition = {
  coordinates: [12, 10] as [number, number],
  zoom: 1.18,
};
const minZoom = 1;
const maxZoom = 4.2;

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
  const [mapPosition, setMapPosition] = useState(defaultMapPosition);

  function updateZoom(nextZoom: number) {
    setMapPosition((current) => ({
      ...current,
      zoom: Math.min(maxZoom, Math.max(minZoom, nextZoom)),
    }));
  }

  function resetMapPosition() {
    setMapPosition(defaultMapPosition);
  }

  return (
    <section
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_52%_38%,rgba(73,107,110,0.58),transparent_38rem),linear-gradient(150deg,rgba(6,20,27,0.98),rgba(11,47,54,0.96)_48%,rgba(19,72,67,0.88))]"
      aria-label="Choose a country"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,14,20,0.22),rgba(4,14,20,0.06)_42%,rgba(4,14,20,0.42))]" />
      <div className="relative flex h-full min-h-screen items-center justify-center px-2 pb-36 pt-24 sm:px-8 sm:pb-32 sm:pt-28 lg:pb-8 lg:pr-[25rem] lg:pt-8">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 190, center: [12, 10] }}
          className="h-full max-h-[52rem] w-full cursor-grab drop-shadow-2xl active:cursor-grabbing"
          width={980}
          height={560}
        >
          <ZoomableGroup
            center={mapPosition.coordinates}
            zoom={mapPosition.zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            onMoveEnd={(position) => {
              setMapPosition({
                coordinates: position.coordinates,
                zoom: position.zoom,
              });
            }}
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
                            : "rgba(184, 204, 203, 0.42)",
                          stroke: isSelected
                            ? "#fff5d1"
                            : "rgba(255,255,255,0.18)",
                          strokeWidth: isSelected ? 1.5 : 0.52,
                          filter: isSelected
                            ? "drop-shadow(0 0 8px rgba(243,199,95,0.42))"
                            : "none",
                        },
                        hover: {
                          fill: "#f3c75f",
                          stroke: "#fff5d1",
                          strokeWidth: 1.05,
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
          </ZoomableGroup>
        </ComposableMap>
      </div>
      <div className="absolute bottom-6 left-4 z-10 flex flex-col overflow-hidden rounded-2xl border border-white/14 bg-atlas-ink/32 text-white shadow-soft-xl backdrop-blur-2xl sm:bottom-8 sm:left-6">
        <button
          className="flex h-11 w-11 items-center justify-center border-b border-white/10 text-2xl font-light text-white/82 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-atlas-gold/50"
          type="button"
          onClick={() => updateZoom(mapPosition.zoom + 0.42)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="flex h-11 w-11 items-center justify-center border-b border-white/10 text-2xl font-light text-white/82 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-atlas-gold/50"
          type="button"
          onClick={() => updateZoom(mapPosition.zoom - 0.42)}
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          className="flex h-11 w-11 items-center justify-center text-white/78 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-atlas-gold/50"
          type="button"
          onClick={resetMapPosition}
          aria-label="Reset map view"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="7" />
            <path d="M12 3v3" />
            <path d="M12 18v3" />
            <path d="M3 12h3" />
            <path d="M18 12h3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
