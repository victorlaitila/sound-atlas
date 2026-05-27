declare module "react-simple-maps" {
  import type {
    ComponentType,
    KeyboardEventHandler,
    MouseEventHandler,
    ReactNode,
    SVGProps,
  } from "react";

  export type GeographyDatum = {
    rsmKey: string;
    id?: string | number;
    properties?: Record<string, unknown>;
  };

  type GeographyStyle = {
    default?: Record<string, string | number>;
    hover?: Record<string, string | number>;
    pressed?: Record<string, string | number>;
  };

  export const ComposableMap: ComponentType<{
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    className?: string;
    children?: ReactNode;
  }>;

  export const Geographies: ComponentType<{
    geography: unknown;
    children: (props: { geographies: GeographyDatum[] }) => ReactNode;
  }>;

  export const Geography: ComponentType<
    SVGProps<SVGPathElement> & {
      geography: GeographyDatum;
      role?: string;
      tabIndex?: number;
      "aria-label"?: string;
      style?: GeographyStyle;
      onClick?: MouseEventHandler<SVGPathElement>;
      onKeyDown?: KeyboardEventHandler<SVGPathElement>;
    }
  >;

  export const ZoomableGroup: ComponentType<
    SVGProps<SVGGElement> & {
      center?: [number, number];
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      translateExtent?: [[number, number], [number, number]];
      filterZoomEvent?: (event: unknown) => boolean;
      onMoveStart?: (
        position: { coordinates: [number, number]; zoom: number },
        event: unknown,
      ) => void;
      onMove?: (
        position: {
          x: number;
          y: number;
          zoom: number;
          dragging?: unknown;
        },
        event: unknown,
      ) => void;
      onMoveEnd?: (
        position: { coordinates: [number, number]; zoom: number },
        event: unknown,
      ) => void;
    }
  >;
}
