export type AudioAsset = {
  source: "itunes";
  sourceId: string;
  countryCode: string;
  title: string;
  creator: string;
  sourceUrl: string;
  audioUrl: string;
  artworkUrl: string | null;
  licenseName: string;
  licenseUrl: string;
  attributionText: string;
  duration: number;
  tags: string[];
  relationScore: number;
  relationReason: string;
  selectionType: "curated" | "dynamic";
  fetchedAt: string;
};
