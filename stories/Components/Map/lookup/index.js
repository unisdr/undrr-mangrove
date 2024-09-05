import data from "./data.json";

export const getCountryCoords = (countryIsoCode) => {
  // If there's nothing passed, return null
  if (!countryIsoCode) return null;

  // First, try to match by ISO alpha-3 code
  const result = data.find(
    (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
  );
  
  return match ? [match.latitude, match.longitude] : null;
};

export const getContinent = (countryIsoCode) => {
  // If there's nothing passed, return null
  if (!countryIsoCode) return null;

  // First, try to match by ISO alpha-3 code
  const match = data.find(
    (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
  );

  return match ? match.continent : null;
};