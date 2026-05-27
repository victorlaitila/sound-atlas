export type DynamicCountryMusicCuration = {
  countryCode: string;
  primaryQuery: string;
  backupQueries: string[];
  blockedTerms: string[];
  preferredGenres: string[];
  notes: string;
};

export const dynamicCountryMusicFallbacks: DynamicCountryMusicCuration[] = [
  {
    countryCode: "FI",
    primaryQuery: "kantele Finnish folk",
    backupQueries: ["Finnish folk music", "Varttina", "Loituma", "Finnish kantele"],
    blockedTerms: ["Norway", "Norwegian", "Sweden", "Swedish", "Made in Norway", "Nordic Folk"],
    preferredGenres: ["folk", "world", "traditional"],
    notes: "Avoid broad Nordic results unless the result has clear Finnish or kantele signals.",
  },
  {
    countryCode: "JP",
    primaryQuery: "Japanese koto",
    backupQueries: ["shamisen Japanese traditional", "Japanese traditional", "J-pop"],
    blockedTerms: ["Chinese", "Korean", "Thai"],
    preferredGenres: ["world", "j-pop", "pop", "traditional"],
    notes: "Koto, shamisen, Japanese traditional, and J-pop are preferred signals.",
  },
  {
    countryCode: "BR",
    primaryQuery: "samba Brazil",
    backupQueries: ["bossa nova Brazil", "Brazilian music", "MPB Brazilian"],
    blockedTerms: ["Portugal", "Portuguese guitar"],
    preferredGenres: ["samba", "bossa nova", "mpb", "latin", "brasileira"],
    notes: "Prefer samba, bossa nova, and Brazilian artist or genre signals.",
  },
  {
    countryCode: "MA",
    primaryQuery: "gnawa Morocco",
    backupQueries: ["oud Morocco", "Moroccan music", "chaabi Morocco"],
    blockedTerms: ["Egyptian", "Turkey", "Turkish"],
    preferredGenres: ["world", "african", "arabic", "traditional"],
    notes: "Gnawa, oud, and Moroccan music are the primary cues.",
  },
  {
    countryCode: "IN",
    primaryQuery: "sitar Indian classical",
    backupQueries: ["tabla Indian classical", "Indian classical", "Bollywood"],
    blockedTerms: ["Native American", "American Indian"],
    preferredGenres: ["indian", "bollywood", "world", "classical"],
    notes: "Prefer sitar, tabla, Indian classical, and Bollywood signals.",
  },
  {
    countryCode: "FR",
    primaryQuery: "chanson francaise",
    backupQueries: ["French pop", "accordion France", "musette accordion"],
    blockedTerms: ["French Montana", "French Horn"],
    preferredGenres: ["chanson", "french pop", "pop", "world"],
    notes: "Chanson francaise, French pop, and accordion are preferred.",
  },
  {
    countryCode: "EG",
    primaryQuery: "Egyptian music",
    backupQueries: ["Arabic music Egypt", "oud Egyptian music", "Umm Kulthum"],
    blockedTerms: ["Moroccan", "Lebanese", "Turkish"],
    preferredGenres: ["arabic", "world", "middle east", "traditional"],
    notes: "Arabic music, oud, and Egyptian artist signals are preferred.",
  },
  {
    countryCode: "US",
    primaryQuery: "jazz",
    backupQueries: ["blues", "country music", "American folk"],
    blockedTerms: [],
    preferredGenres: ["jazz", "blues", "country", "folk"],
    notes: "Jazz, blues, and country music are acceptable US soundtrack anchors.",
  },
  {
    countryCode: "IT",
    primaryQuery: "Italian music",
    backupQueries: ["Italian pop", "tarantella", "opera italiana"],
    blockedTerms: ["French", "Spanish"],
    preferredGenres: ["italian", "pop", "opera", "world"],
    notes: "Prefer Italian pop, tarantella, or opera italiana signals.",
  },
  {
    countryCode: "ES",
    primaryQuery: "flamenco",
    backupQueries: ["Spanish guitar", "copla Spain", "Spanish music"],
    blockedTerms: ["Mexico", "Mexican", "Latin America"],
    preferredGenres: ["flamenco", "spanish", "latin", "world"],
    notes: "Prefer flamenco, Spanish guitar, and Spain-specific signals.",
  },
  {
    countryCode: "SE",
    primaryQuery: "Swedish folk",
    backupQueries: ["nyckelharpa", "Swedish pop", "Swedish music"],
    blockedTerms: ["Norway", "Norwegian", "Finland", "Finnish"],
    preferredGenres: ["folk", "pop", "world"],
    notes: "Swedish folk, nyckelharpa, and Swedish pop are preferred.",
  },
  {
    countryCode: "NO",
    primaryQuery: "Norwegian folk",
    backupQueries: ["Hardanger fiddle", "Norwegian music", "Norway folk"],
    blockedTerms: ["Sweden", "Swedish", "Finland", "Finnish"],
    preferredGenres: ["folk", "world", "traditional"],
    notes: "Norwegian folk and Hardanger fiddle are preferred.",
  },
  {
    countryCode: "DE",
    primaryQuery: "German music",
    backupQueries: ["German pop", "krautrock", "German folk"],
    blockedTerms: ["Austrian", "Swiss"],
    preferredGenres: ["german", "pop", "rock", "folk"],
    notes: "Prefer Germany-specific pop, rock, krautrock, or folk signals.",
  },
  {
    countryCode: "KR",
    primaryQuery: "K-pop",
    backupQueries: ["Korean traditional", "gayageum", "Korean music"],
    blockedTerms: ["Japanese", "Chinese"],
    preferredGenres: ["k-pop", "korean", "pop", "world"],
    notes: "K-pop, Korean traditional, and gayageum are preferred.",
  },
  {
    countryCode: "MX",
    primaryQuery: "mariachi",
    backupQueries: ["ranchera", "Mexican music", "son jarocho"],
    blockedTerms: ["Spain", "Spanish guitar"],
    preferredGenres: ["mariachi", "ranchera", "mexican", "latin"],
    notes: "Mariachi, ranchera, and Mexico-specific genre signals are preferred.",
  },
];

export const dynamicCountryMusicFallbackByCode =
  dynamicCountryMusicFallbacks.reduce<Record<string, DynamicCountryMusicCuration>>(
    (fallbackByCode, entry) => {
      fallbackByCode[entry.countryCode] = entry;
      return fallbackByCode;
    },
    {},
  );
