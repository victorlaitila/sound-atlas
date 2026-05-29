"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import maplibregl from "maplibre-gl";
import type {
  ExpressionSpecification,
  MapLayerMouseEvent,
  StyleSpecification,
} from "maplibre-gl";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-50m.json";
import {
  countryMetadataByMapId,
  getCountryMetadataByMapName,
  getMapCountryId,
} from "@/data/countryMetadata";
import { Locate, Minus, Plus } from "lucide-react";

type WorldMapProps = {
  selectedCountryId: string | null;
  onCountrySelect: (countryId: string) => void;
};

type CountryProperties = {
  name?: string;
  NAME?: string;
};

type SoundAtlasCountryProperties = CountryProperties & {
  countryId: string;
  countryName: string;
};

type WorldAtlasTopology = Topology<{
  countries: GeometryCollection<CountryProperties>;
}>;

const topology = worldAtlas as unknown as WorldAtlasTopology;
const hiddenPolarFeatureIds = new Set(["010", "260"]);
const countryFeatureCollection = buildCountryFeatureCollection();
const initialCenter: [number, number] = [18, 18];
const initialZoom = 2.22;
const minZoom = 0.75;
const maxZoom = 5.25;
const zoomStep = 0.46;
const countryFillColor = "#789291";
const selectedCountryColor = "#f3c75f";
const borderColor = "#000000";
const borderHaloColor = "#041419";
const oceanColor = "#061820";
const zoomControlButtonClass =
  "flex h-10 w-10 items-center justify-center border-b border-white/10 text-xl font-light text-white/78 transition hover:bg-white/10 hover:text-white active:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-gold/45 sm:h-11 sm:w-11 [-webkit-tap-highlight-color:transparent]";

function getCountryName(featureData: Feature<Polygon | MultiPolygon, CountryProperties>) {
  return (
    featureData.properties?.name ??
    featureData.properties?.NAME ??
    "Unknown country"
  );
}

function buildCountryFeatureCollection(): FeatureCollection<
  Polygon | MultiPolygon,
  SoundAtlasCountryProperties
> {
  const countryCollection = feature<CountryProperties>(
    topology,
    topology.objects.countries,
  ) as FeatureCollection<Polygon | MultiPolygon, CountryProperties>;

  return {
    type: "FeatureCollection",
    features: countryCollection.features
      .filter((country) => !hiddenPolarFeatureIds.has(String(country.id)))
      .map((country) => {
        const mapCountryName = getCountryName(country);
        const countryId =
          getMapCountryId(country.id, mapCountryName) ?? String(country.id);
        const metadata =
          countryMetadataByMapId[countryId] ??
          getCountryMetadataByMapName(mapCountryName);
        const countryName = metadata?.name ?? mapCountryName;

        return {
          ...country,
          id: countryId,
          properties: {
            ...country.properties,
            countryId,
            countryName,
          },
        };
      }),
  };
}

function buildSelectedFilter(countryId: string | null): ExpressionSpecification {
  return ["==", ["get", "countryId"], countryId ?? ""];
}

function buildCountryFillExpression(
  countryId: string | null,
): ExpressionSpecification {
  return [
    "case",
    buildSelectedFilter(countryId),
    selectedCountryColor,
    countryFillColor,
  ];
}

function buildMapStyle(selectedCountryId: string | null): StyleSpecification {
  return {
    version: 8,
    projection: {
      type: "globe",
    },
    sources: {
      countries: {
        type: "geojson",
        data: countryFeatureCollection,
        promoteId: "countryId",
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": oceanColor,
        },
      },
      {
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": buildCountryFillExpression(selectedCountryId),
          "fill-opacity": [
            "case",
            buildSelectedFilter(selectedCountryId),
            0.98,
            0.78,
          ],
          "fill-antialias": false,
        },
      },
      {
        id: "country-border-halo",
        type: "line",
        source: "countries",
        paint: {
          "line-color": borderHaloColor,
          "line-opacity": 0.48,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1.05,
            2,
            1.25,
            5,
            1.7,
          ],
          "line-blur": 0.25,
        },
      },
      {
        id: "country-border",
        type: "line",
        source: "countries",
        paint: {
          "line-color": borderColor,
          "line-opacity": 0.78,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.52,
            2,
            0.72,
            5,
            1.05,
          ],
        },
      },
      {
        id: "selected-country-border",
        type: "line",
        source: "countries",
        filter: buildSelectedFilter(selectedCountryId),
        paint: {
          "line-color": borderColor,
          "line-opacity": 0.98,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1.35,
            2,
            1.9,
            5,
            2.7,
          ],
        },
      },
    ],
  };
}

function updateSelectedCountry(
  map: maplibregl.Map,
  selectedCountryId: string | null,
) {
  if (!map.getLayer("countries-fill")) {
    return;
  }

  map.setPaintProperty(
    "countries-fill",
    "fill-color",
    buildCountryFillExpression(selectedCountryId),
  );
  map.setPaintProperty("countries-fill", "fill-opacity", [
    "case",
    buildSelectedFilter(selectedCountryId),
    0.98,
    0.78,
  ]);
  map.setFilter(
    "selected-country-border",
    buildSelectedFilter(selectedCountryId),
  );
}

function mapSupportsWebGl() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

function MapFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-medium text-white/62">
      Interactive globe could not be loaded.
    </div>
  );
}

function WorldMapComponent({ selectedCountryId, onCountrySelect }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectedCountryIdRef = useRef(selectedCountryId);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    selectedCountryIdRef.current = selectedCountryId;
  }, [selectedCountryId]);

  useEffect(() => {
    if (!mapSupportsWebGl()) {
      setMapFailed(true);
      return undefined;
    }

    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const map = new maplibregl.Map({
      container,
      style: buildMapStyle(selectedCountryIdRef.current),
      center: initialCenter,
      zoom: initialZoom,
      minZoom,
      maxZoom,
      attributionControl: false,
      maplibreLogo: false,
      renderWorldCopies: false,
      canvasContextAttributes: {
        antialias: true,
        powerPreference: "high-performance",
      },
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 0,
    });

    mapRef.current = map;

    map.on("error", (event) => {
      console.error("SoundAtlas map failed", event.error);
      setMapFailed(true);
    });

    map.on("load", () => {
      map.setSky({
        "sky-color": "transparent",
        "horizon-color": "transparent",
        "fog-color": "transparent",
        "fog-ground-blend": 1,
        "atmosphere-blend": 0,
      });
      updateSelectedCountry(map, selectedCountryIdRef.current);
    });

    map.on("click", "countries-fill", (event: MapLayerMouseEvent) => {
      const countryId = event.features?.[0]?.properties?.countryId;

      if (typeof countryId === "string") {
        onCountrySelect(countryId);
      }
    });

    map.on("mouseenter", "countries-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "countries-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [onCountrySelect]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (map.isStyleLoaded()) {
      updateSelectedCountry(map, selectedCountryId);
      return;
    }

    const updateAfterLoad = () => updateSelectedCountry(map, selectedCountryId);
    map.once("load", updateAfterLoad);

    return () => {
      map.off("load", updateAfterLoad);
    };
  }, [selectedCountryId]);

  const updateZoom = useCallback((delta: number) => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const nextZoom = Math.min(maxZoom, Math.max(minZoom, map.getZoom() + delta));
    map.easeTo({
      zoom: nextZoom,
      duration: 520,
      easing: (time) => 1 - (1 - time) ** 3,
      essential: true,
    });
  }, []);

  const resetGlobePosition = useCallback(() => {
    mapRef.current?.easeTo({
      center: initialCenter,
      zoom: initialZoom,
      bearing: 0,
      pitch: 0,
      duration: 760,
      easing: (time) => 1 - (1 - time) ** 3,
      essential: true,
    });
  }, []);

  return (
    <section
      className="absolute inset-0 h-screen w-screen touch-none overflow-hidden bg-[radial-gradient(circle_at_58%_40%,rgba(58,94,99,0.44),transparent_34rem),linear-gradient(150deg,rgba(4,14,20,1),rgba(8,36,44,0.98)_48%,rgba(13,57,55,0.9))]"
      aria-label="Choose a country"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,14,20,0.18),rgba(4,14,20,0.04)_42%,rgba(4,14,20,0.48))]" />
      <div className="absolute inset-0">
        {mapFailed ? <MapFallback /> : null}
        <div
          ref={containerRef}
          className={mapFailed ? "hidden" : "h-full w-full"}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,transparent_28rem,rgba(2,8,12,0.16)_44rem,rgba(2,8,12,0.38)_100%)]" />
      <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/12 bg-atlas-ink/28 text-white shadow-soft-xl backdrop-blur-2xl sm:left-6">
        <button
          className={zoomControlButtonClass}
          type="button"
          onClick={() => updateZoom(zoomStep)}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          className={zoomControlButtonClass}
          type="button"
          onClick={() => updateZoom(-zoomStep)}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center text-white/72 transition hover:bg-white/10 hover:text-white active:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-gold/45 sm:h-11 sm:w-11 [-webkit-tap-highlight-color:transparent]"
          type="button"
          onClick={resetGlobePosition}
          aria-label="Reset globe view"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

export const WorldMap = memo(WorldMapComponent);
