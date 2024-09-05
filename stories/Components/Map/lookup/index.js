import data from "./data.json";

export const getCountryIsoName = (countryIsoCode) => {
  if (!countryIsoCode) return null;

  const country = data.find(
    (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
  );

  // If no country match, fallback to lat/lon
  return country ? [country.latitude, country.longitude] : null;
};

export const getContinent = (countryIsoCode) => {
  if (!countryIsoCode) return null;

  const match = data.find(
    (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
  );
  
  // Check if match is found and return the continent code, otherwise return null
  const continent = match ? match.continent : null;
  
  return continent;
};
