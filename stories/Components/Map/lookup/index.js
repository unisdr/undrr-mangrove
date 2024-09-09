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
  // For UNDRR north and south america are grouped
  if (match) {
    if ((match.continent.toUpperCase() === "NORTH AMERICA" )|| (match.continent.toUpperCase() === "SOUTH AMERICA")) {
      match.continent = "Americas";
    }
  }
  return match ? match.continent : null;
};
