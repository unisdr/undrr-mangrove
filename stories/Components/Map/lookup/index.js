import data from "./data.json";

const findCountryByIsoCode = (countryIsoCode) => {
  if (!countryIsoCode) return null;

  return data.find((c) => c.iso_alpha_3 === countryIsoCode.toUpperCase());
};

export const getCountryCoords = (countryIsoCode) => {
  const match = findCountryByIsoCode(countryIsoCode);
  return match ? [match.latitude, match.longitude] : null;
};

export const getContinent = (countryIsoCode) => {
  const match = findCountryByIsoCode(countryIsoCode);
  return match ? match.continent : null;
};
