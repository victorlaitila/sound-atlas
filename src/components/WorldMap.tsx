"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  type GeographyDatum,
} from "react-simple-maps";
import worldAtlas from "world-atlas/countries-50m.json";
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
  zoom: 1.16,
};
const minZoom = 1;
const maxZoom = 5;
const mapWidth = 980;
const mapHeight = 560;
const mapBounds = {
  west: -172,
  east: 178,
  south: -58,
  north: 82,
};
const translateExtent: [[number, number], [number, number]] = [
  [0, 0],
  [mapWidth, mapHeight],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMapPosition(position: {
  coordinates: [number, number];
  zoom: number;
}) {
  return {
    coordinates: [
      clamp(position.coordinates[0], mapBounds.west, mapBounds.east),
      clamp(position.coordinates[1], mapBounds.south, mapBounds.north),
    ] as [number, number],
    zoom: clamp(position.zoom, minZoom, maxZoom),
  };
}

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
  const [isMoving, setIsMoving] = useState(false);

  function updateZoom(nextZoom: number) {
    setMapPosition((current) =>
      normalizeMapPosition({
        ...current,
        zoom: nextZoom,
      }),
    );
  }

  function resetMapPosition() {
    setMapPosition(defaultMapPosition);
  }

  return (
    <section
      className="absolute inset-0 h-screen w-screen touch-none overflow-hidden bg-[radial-gradient(circle_at_52%_38%,rgba(73,107,110,0.58),transparent_38rem),linear-gradient(150deg,rgba(6,20,27,0.98),rgba(11,47,54,0.96)_48%,rgba(19,72,67,0.88))]"
      aria-label="Choose a country"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,14,20,0.22),rgba(4,14,20,0.06)_42%,rgba(4,14,20,0.42))]" />
      <div className="absolute inset-0">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 194, center: [12, 8] }}
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full cursor-grab select-none drop-shadow-2xl active:cursor-grabbing"
          width={mapWidth}
          height={mapHeight}
        >
          <ZoomableGroup
            center={mapPosition.coordinates}
            zoom={mapPosition.zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            translateExtent={translateExtent}
            className={
              isMoving
                ? ""
                : "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            }
            onMoveStart={() => {
              setIsMoving(true);
            }}
            onMoveEnd={(position) => {
              setMapPosition(normalizeMapPosition(position));
              window.setTimeout(() => setIsMoving(false), 80);
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
                            : "rgba(184, 204, 203, 0.46)",
                          stroke: isSelected
                            ? "#fff5d1"
                            : "rgba(255,255,255,0.24)",
                          strokeWidth: isSelected ? 1.4 : 0.46,
                          vectorEffect: "non-scaling-stroke",
                          filter: isSelected
                            ? "drop-shadow(0 0 8px rgba(243,199,95,0.42))"
                            : "none",
                        },
                        hover: {
                          fill: "#f3c75f",
                          stroke: "#fff5d1",
                          strokeWidth: 1.05,
                          vectorEffect: "non-scaling-stroke",
                        },
                        pressed: {
                          fill: "#df6d5d",
                          stroke: "#ffffff",
                          strokeWidth: 1.2,
                          vectorEffect: "non-scaling-stroke",
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
      <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/12 bg-atlas-ink/28 text-white shadow-soft-xl backdrop-blur-2xl sm:left-6">
        <button
          className="flex h-10 w-10 items-center justify-center border-b border-white/10 text-xl font-light text-white/78 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-atlas-gold/50 sm:h-11 sm:w-11"
          type="button"
          onClick={() => updateZoom(mapPosition.zoom + 0.42)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center border-b border-white/10 text-xl font-light text-white/78 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-atlas-gold/50 sm:h-11 sm:w-11"
          type="button"
          onClick={() => updateZoom(mapPosition.zoom - 0.42)}
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center text-white/72 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-atlas-gold/50 sm:h-11 sm:w-11"
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
