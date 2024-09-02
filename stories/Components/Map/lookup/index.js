import data from "./data.json";

export const getLatLong = (countryIsoCode) => {
  if (!countryIsoCode) return null;

  const country = data.find(
    (c) => c.country === countryIsoCode.substring(0, 2)
  );

  return country ? [country.latitude, country.longitude] : null;
};
