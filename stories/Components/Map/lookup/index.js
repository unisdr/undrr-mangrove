import data from "./data.json";

export const getCountryCoords = (countryIsoCode, countryName) => {
  // If there's nothing passed, return null
  if (!countryIsoCode && !countryName) return null;
  // console.log(countryIsoCode, countryName)

  // First, try to match by ISO alpha-3 code
  if (countryIsoCode) {
    const match = data.find(
      (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
    );
    return match ? [match.latitude, match.longitude] : null;
  }

  // If no match, fall back to match by country name (e.g. continents)
  // console.log(countryIsoCode, countryName);
  return null;
};

export const getContinent = (countryIsoCode, countryName) => {
  // If there's nothing passed, return null
  if (!countryIsoCode && !countryName) return null;

  // First, try to match by ISO alpha-3 code
  if (countryIsoCode) {
    const match = data.find(
      (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
    );

    const continent = match ? match.continent : null;

    return continent;
  }

  // If no match, fall back to match by country name (e.g. continents)
  // console.log(countryIsoCode, countryName);

  const match = data.find(
    (c) => c.continent === countryName
  );
  const continent = match ? match.continent : null;

  return continent;
};