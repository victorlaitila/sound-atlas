import countries, { type Country } from "world-countries";

export type CountryMetadata = {
  mapId: string;
  name: string;
  aliases: string[];
  isoCode: string | null;
  isoAlpha3: string | null;
  numericCode: string | null;
  region: string;
  capital: string | null;
  searchTerms: string[];
};

type ManualCountryMetadata = Omit<CountryMetadata, "searchTerms"> & {
  searchTerms?: string[];
  mapNames: string[];
};

const manualMapCountries: ManualCountryMetadata[] = [
  {
    mapId: "XKX",
    name: "Kosovo",
    aliases: ["Kosova"],
    isoCode: "XK",
    isoAlpha3: "XKX",
    numericCode: null,
    region: "Europe / Southeast Europe",
    capital: "Pristina",
    mapNames: ["Kosovo"],
  },
  {
    mapId: "CYN",
    name: "Northern Cyprus",
    aliases: ["N. Cyprus"],
    isoCode: null,
    isoAlpha3: null,
    numericCode: null,
    region: "Asia / Western Asia",
    capital: "North Nicosia",
    mapNames: ["N. Cyprus", "Northern Cyprus"],
  },
  {
    mapId: "SOL",
    name: "Somaliland",
    aliases: [],
    isoCode: null,
    isoAlpha3: null,
    numericCode: null,
    region: "Africa / Eastern Africa",
    capital: "Hargeisa",
    mapNames: ["Somaliland"],
  },
];

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function normalizeNumericCode(code: string | number | undefined | null) {
  if (code === undefined || code === null || code === "") {
    return null;
  }

  return String(code).padStart(3, "0");
}

function formatRegion(country: Pick<Country, "region" | "subregion">) {
  return country.subregion
    ? `${country.region} / ${country.subregion}`
    : country.region;
}

function buildSearchTerms({
  name,
  region,
  capital,
}: Pick<CountryMetadata, "name" | "region" | "capital">) {
  const terms = [
    `${name} traditional music`,
    `${name} folk music`,
    `${name} ambient soundscape`,
    `${name} field recordings`,
    `${region} cultural sounds`,
  ];

  if (capital) {
    terms.splice(2, 0, `${capital} street ambience`);
  }

  return [...new Set(terms)];
}

function getCountryAliases(country: Country) {
  return [
    ...country.altSpellings,
    ...Object.values(country.translations ?? {}).map(
      (translation) => translation.common,
    ),
  ].filter((alias) => alias !== country.name.common);
}

function toMetadata(country: Country): CountryMetadata {
  const numericCode = normalizeNumericCode(country.ccn3);
  const metadata = {
    mapId: numericCode ?? country.cca3,
    name: country.name.common,
    aliases: getCountryAliases(country),
    isoCode: country.cca2,
    isoAlpha3: country.cca3,
    numericCode,
    region: formatRegion(country),
    capital: country.capital[0] ?? null,
  };

  return {
    ...metadata,
    searchTerms: buildSearchTerms(metadata),
  };
}

function toManualMetadata(country: ManualCountryMetadata): CountryMetadata {
  return {
    mapId: country.mapId,
    name: country.name,
    aliases: country.aliases,
    isoCode: country.isoCode,
    isoAlpha3: country.isoAlpha3,
    numericCode: country.numericCode,
    region: country.region,
    capital: country.capital,
    searchTerms: country.searchTerms ?? buildSearchTerms(country),
  };
}

export const countryMetadata: CountryMetadata[] = [
  ...countries.map(toMetadata),
  ...manualMapCountries.map(toManualMetadata),
];

export const countryMetadataByMapId = countryMetadata.reduce<
  Record<string, CountryMetadata>
>((metadataById, metadata) => {
  metadataById[metadata.mapId] = metadata;
  return metadataById;
}, {});

export const countryMetadataByIsoCode = countryMetadata.reduce<
  Record<string, CountryMetadata>
>((metadataByIsoCode, metadata) => {
  if (metadata.isoCode) {
    metadataByIsoCode[metadata.isoCode] = metadata;
  }

  if (metadata.isoAlpha3) {
    metadataByIsoCode[metadata.isoAlpha3] = metadata;
  }

  return metadataByIsoCode;
}, {});

const countryMetadataByMapName = new Map<string, CountryMetadata>();

for (const metadata of countryMetadata) {
  countryMetadataByMapName.set(normalizeName(metadata.name), metadata);
}

for (const metadata of manualMapCountries) {
  const resolvedMetadata = countryMetadataByMapId[metadata.mapId];

  for (const mapName of metadata.mapNames) {
    countryMetadataByMapName.set(normalizeName(mapName), resolvedMetadata);
  }
}

export function getMapCountryId(
  rawCountryId: string | number | undefined,
  mapCountryName: string,
) {
  const numericCode = normalizeNumericCode(rawCountryId);

  if (numericCode && countryMetadataByMapId[numericCode]) {
    return numericCode;
  }

  return countryMetadataByMapName.get(normalizeName(mapCountryName))?.mapId ?? null;
}

export function getCountryMetadataByMapName(mapCountryName: string) {
  return countryMetadataByMapName.get(normalizeName(mapCountryName)) ?? null;
}
